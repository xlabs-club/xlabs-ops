import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import * as ejs from "ejs";

let config = new pulumi.Config();

//  在pulumi里requireSecret是一种特殊的类型 Output<String>，Output无法直接用于String替换，详情参考apply说明
const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("oauthClientID"),
        config.requireSecret("oauthClientSecret"),
        config.requireSecret("redisPassword")
    ])
    .apply(([clientID, clientSecret, redisPassword]) => {
        const replaceVars = {
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            hostname: "opy." + config.require("hostnameSuffix"),
            whiteList: "*." + config.require("hostnameSuffix"),
            clientID: clientID,
            clientSecret: clientSecret,
            redisPassword: redisPassword
        }
        const rendered = ejs.renderFile("./oauth2-proxy.values.yaml", replaceVars);
        return new pulumi.asset.StringAsset(rendered);
    });

// Deploy oauth2-proxy using the Helm chart
const oauth2ProxyRelease = new kubernetes.helm.v3.Release("oauth2-proxy", {
    name: "oauth2-proxy",
    chart: "oci://registry-1.docker.io/bitnamicharts/oauth2-proxy",
    version: "7.0.3",
    namespace: "oauth2-proxy",
    createNamespace: true,
    timeout: 60,
    maxHistory: 5,
    valueYamlFiles: [valueYamlAsset]
});

export const oauth2ProxyReleaseStatus = oauth2ProxyRelease.status;

