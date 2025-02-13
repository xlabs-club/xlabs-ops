import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("globalPostgresPassword")
    ])
    .apply(([postgrePwd]) => {
        const replaceVars = {
            hostname: "dify." + config.require("hostnameSuffix"),
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            postgresPassword: postgrePwd
        }
        return new pulumi.asset.StringAsset(ejs.renderFile("./dify.values.yaml", replaceVars));
    });


const difyRelease = new kubernetes.helm.v3.Release("dify", {
    name: "dify",
    chart: "dify",
    version: "0.22.0",
    namespace: "dify",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://borispolonsky.github.io/dify-helm",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const difyReleaseStatus = difyRelease.status;

