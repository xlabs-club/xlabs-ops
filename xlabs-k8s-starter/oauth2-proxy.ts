import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import * as ejs from "ejs";

let config = new pulumi.Config();

//  在pulumi里requireSecret是一种特殊的类型 Output<String>，Output无法直接用于String替换，详情参考apply说明
const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("oauthClientID"),
        config.requireSecret("oauthClientSecret")
    ])
    .apply(([clientID, clientSecret]) => {
        const replaceVars = {
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            hostname: "opy." + config.require("hostnameSuffix"),
            clientID: clientID,
            clientSecret: clientSecret
        }
        const rendered = ejs.renderFile("./oauth2-proxy.values.yaml", replaceVars);
        return new pulumi.asset.StringAsset(rendered);
    });

// Deploy oauth2-proxy using the Helm chart
const oauth2ProxyRelease = new kubernetes.helm.v3.Release("oauth2-proxy", {
    name: "oauth2-proxy",
    chart: "oci://registry-1.docker.io/bitnamicharts/oauth2-proxy",
    version: "6.0.2",
    namespace: "oauth2-proxy",
    createNamespace: true,
    timeout: 300,
    valueYamlFiles: [valueYamlAsset]
});

// 修改 ingress host 后缀
const transformIngressHost = (obj: any, opts: pulumi.CustomResourceOptions) => {
    if (obj.kind === "Ingress") {
        obj.spec.rules.forEach((rule: any) => {
            rule.host = "*." + config.require("hostnameSuffix");
        });
        obj.spec.tls.forEach((rule: any) => {
            rule.host = "*." + config.require("hostnameSuffix");
        });
    }
};

// 根据yaml文件创建 traefik Middleware
const traefikConfig = new kubernetes.yaml.ConfigFile("oauth2-proxy-traefik", {
    file: "./oauth2-proxy-traefik.yaml",
    transformations: [transformIngressHost],
});

export const oauth2ProxyReleaseStatus = oauth2ProxyRelease.status;
// Export the name of the Ingress
export const ingressName = traefikConfig.getResource("networking.k8s.io/v1/Ingress", "oauth2-proxy", "oauth-errors-sign-in").metadata.name;

