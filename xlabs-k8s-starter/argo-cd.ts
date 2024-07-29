import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

// Deploy argo-cd using the Helm chart
const helmRelease = new kubernetes.helm.v3.Release("argo-cd", {
    name: "argo-cd",
    chart: "oci://registry-1.docker.io/bitnamicharts/argo-cd",
    version: "6.6.9",
    namespace: "argo-cd",
    createNamespace: true,
    timeout: 600,
    // valueYamlFiles: [new FileAsset("./values.yml")],
    values: {
        ingress: {
            enabled: true,
            hostname: "argo-cd." + config.require("hostnameSuffix"),
            annotations: {
                "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
            },
        },
        config: {
            secret: {
                argocdServerAdminPassword: config.requireSecret("argocdServerAdminPassword")
            }
        }
    },
});


export const argoCdReleaseStatus = helmRelease.status;
