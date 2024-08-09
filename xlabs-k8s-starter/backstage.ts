import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const hostname = "app." + config.require("hostnameSuffix");

//  在pulumi里requireSecret是一种特殊的类型 Output<String>，Output无法直接用于String替换，详情参考apply说明
const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("globalImageRegistry"),
        config.requireSecret("globalPostgresPassword")
    ])
    .apply(([registry, password]) => {
        const replaceVars = {
            hostname: hostname,
            baseUrl: "https://" + hostname,
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            registry: registry,
            postgresPassword: password
        }
        // 通过模板语法替换， <%= xxx %> 是ejs的语法
        const rendered = ejs.renderFile("./backstage.values.yaml", replaceVars);
        return new pulumi.asset.StringAsset(rendered);
    });

// Deploy backstage using the Helm chart
const backstageRelease = new kubernetes.helm.v3.Release("backstage", {
    name: "backstage",
    chart: "oci://ghcr.io/backstage/charts/backstage",
    version: "1.9.6",
    namespace: "backstage",
    createNamespace: true,
    timeout: 300,
    valueYamlFiles: [valueYamlAsset]
});


export const backstageReleaseStatus = backstageRelease.status;
