import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as tls from "@pulumi/tls";

let config = new pulumi.Config();


// Generate a new private key for the CA
const caPrivateKey = new tls.PrivateKey("caPrivateKey", {
    algorithm: "RSA",
});

// Create a self-signed CA certificate
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

// Create a Kubernetes Secret to store the CA certificate and private key
const caSecret = new kubernetes.core.v1.Secret("caSecret", {
    metadata: {
        name: "ca-secret",
    },
    type: "Opaque",
    stringData: {
        "tls.crt": caCert.certPem,
        "tls.key": caPrivateKey.privateKeyPem,
    },
});

// Create a cert-manager CA issuer that references the Kubernetes Secret
const caIssuer = new kubernetes.apiextensions.CustomResource("caIssuer", {
    apiVersion: "cert-manager.io/v1",
    kind: "Issuer",
    metadata: {
        name: "ca-issuer",
    },
    spec: {
        ca: {
            secretName: caSecret.metadata.name,
        },
    },
});

// Export the CA certificate and private key PEMs
export const caCertificatePem = caCert.certPem;
export const caPrivateKeyPem = caPrivateKey.privateKeyPem;


// pulumi stack output caCertificatePem --show-secrets > ca.crt.pem
// pulumi stack output caPrivateKeyPem --show-secrets > ca.key.pem
