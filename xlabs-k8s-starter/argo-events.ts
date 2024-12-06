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
            hostname: "argo-ws." + config.require("hostnameSuffix"),
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            postgresPassword: postgrePwd
        }
        return new pulumi.asset.StringAsset(ejs.renderFile("./argo-events.values.yaml", replaceVars));
    });

const argoEventsRelease = new kubernetes.helm.v3.Release("argo-events", {
    name: "argo-events",
    chart: "argo-events",
    version: "2.4.9",
    namespace: "argo",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://argoproj.github.io/argo-helm",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const argoEventsReleaseStatus = argoEventsRelease.status;

