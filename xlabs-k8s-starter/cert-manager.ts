import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as tls from "@pulumi/tls";

let config = new pulumi.Config();

// 部署 cert-manager Helm chart
const certManagerRelease = new kubernetes.helm.v3.Release("cert-manager", {
    name: "cert-manager",
    chart: "cert-manager",
    version: "1.15.3",
    namespace: "cert-manager",
    createNamespace: true,
    timeout: 300,
    repositoryOpts: {
        repo: "https://charts.jetstack.io",
    },
    values: {
        installCRDs: true,
    },
});

// 生成一个 CA private key
const caPrivateKey = new tls.PrivateKey("caPrivateKey", {
    algorithm: "RSA",
});

// 生成一个 自签名 CA 证书
const caCert = new tls.SelfSignedCert("caCert", {
    // keyAlgorithm: "RSA",
    privateKeyPem: caPrivateKey.privateKeyPem,
    isCaCertificate: true,
    validityPeriodHours: 87600, // 10 year
    allowedUses: [
        "cert_signing",
        "crl_signing",
    ],
    subject: {
        commonName: config.require("hostnameSuffix"),
        organization: "Xlabs Club",
    },
});

// 生成一个带有 CA crt 和 key 的 Kubernetes Secret
const caSecret = new kubernetes.core.v1.Secret("caSecret", {
    metadata: {
        name: "selfsigned-cert-manager-ca",
        namespace: "cert-manager",
    },
    type: "Opaque",
    stringData: {
        "tls.crt": caCert.certPem,
        "tls.key": caPrivateKey.privateKeyPem,
    },
});

// 创建一个自签名的ClusterIssuer给ingress用
const clusterIssuer = new kubernetes.apiextensions.CustomResource("selfsigned-issuer", {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: {
        name: config.require("clusterIssuer"),
        // 注意 ClusterIssuer 和 caSecret 放在同一个namespace，不写 namespace 时 ClusterIssuer 找不到 caSecret
        namespace: "cert-manager",
    },
    spec: {
        ca: {
            secretName: caSecret.metadata.name,
        },
    },
},
    { dependsOn: certManagerRelease }
);

export const clusterIssuerName = clusterIssuer.metadata.name;

// Export CA 证书，便于客户端导入信任证书
// export const caCertificatePem = caCert.certPem;
// mkdir output
// pulumi stack output caCertificatePem --show-secrets > output/ca.crt.pem
// Mac import
// sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain output/ca.crt.pem