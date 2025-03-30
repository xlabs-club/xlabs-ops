import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

// ingress hostname
const hostname = "app." + config.require("hostnameSuffix");

//  在pulumi里requireSecret是一种特殊的类型 Output<String>，Output无法直接用于String替换，详情参考apply说明
const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("globalPostgresPassword"),
        config.requireSecret("backstageClientId"),
        config.requireSecret("backstageClientSecret"),
        config.requireSecret("adminToken")
    ])
    .apply(([password, clientId, clientSecret, adminToken]) => {
        const replaceVars = {
            baseUrl: "https://" + hostname,
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            backstageClientId: clientId,
            backstageClientSecret: clientSecret,
            postgresPassword: password,
            adminToken: adminToken
        }
        // 通过模板语法替换， <%= xxx %> 是ejs的语法
        const rendered = ejs.renderFile("./backstage.values.yaml", replaceVars);
        return new pulumi.asset.StringAsset(rendered);
    });
// Deploy backstage using the Helm chart
const backstageRelease = new kubernetes.helm.v3.Release("backstage", {
    name: "backstage",
    chart: "backstage",
    // chart: "oci://ghcr.io/backstage/charts/backstage",
    version: "2.4.0",
    namespace: "backstage",
    createNamespace: true,
    repositoryOpts: {
        repo: "https://backstage.github.io/charts",
    },
    timeout: 300,
    maxHistory: 10,
    valueYamlFiles: [valueYamlAsset]
});

const oauht2BackstageValueYamlAsset = pulumi.all(
    [
        config.requireSecret("oauthClientID"),
        config.requireSecret("oauthClientSecret"),
    ])
    .apply(([clientID, clientSecret]) => {
        const replaceVars = {
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            hostname: hostname,
            whiteList: "*." + config.require("hostnameSuffix"),
            clientID: clientID,
            clientSecret: clientSecret
        }
        const rendered = ejs.renderFile("./backstage-oauth2-proxy.values.yaml", replaceVars);
        return new pulumi.asset.StringAsset(rendered);
    });

// Deploy oauth2-proxy using the Helm chart
const oauth2ProxyBackstageRelease = new kubernetes.helm.v3.Release("backstage-oauth2-proxy", {
    name: "backstage-oauth2-proxy",
    chart: "oci://registry-1.docker.io/bitnamicharts/oauth2-proxy",
    version: "6.2.10",
    namespace: "backstage",
    createNamespace: true,
    timeout: 120,
    maxHistory: 10,
    valueYamlFiles: [oauht2BackstageValueYamlAsset]
});


export const backstageReleaseStatus = backstageRelease.status;
export const oauth2ProxyBackstageReleaseStatus = oauth2ProxyBackstageRelease.status;
