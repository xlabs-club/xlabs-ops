import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const ssoSecret = new kubernetes.core.v1.Secret("argo-workflows-sso", {
    metadata: {
        name: "argo-workflows-sso",
        namespace: "argo",
    },
    stringData: {
        "clientId": config.requireSecret("oauthClientID"),
        "clientSecret": config.requireSecret("oauthClientSecret"),
    },
});


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
        return new pulumi.asset.StringAsset(ejs.renderFile("./argo-workflows.values.yaml", replaceVars));
    });

// Deploy argo-workflows using the Helm chart
const argoRelease = new kubernetes.helm.v3.Release("argo-workflows", {
    name: "argo-workflows",
    chart: "oci://registry-1.docker.io/bitnamicharts/argo-workflows",
    version: "11.1.7",
    namespace: "argo",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    valueYamlFiles: [valueYamlAsset]
});

export const ssoSecretName = ssoSecret.metadata.name;
export const argoWorkflowsReleaseStatus = argoRelease.status;

