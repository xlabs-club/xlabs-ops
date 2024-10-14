import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

// Deploy argo-workflows using the Helm chart
const argoRelease = new kubernetes.helm.v3.Release("argo-workflows", {
    name: "argo-workflows",
    chart: "oci://registry-1.docker.io/bitnamicharts/argo-workflows",
    version: "9.1.17",
    namespace: "argo-workflows",
    createNamespace: true,
    timeout: 300,
    values: {
        ingress: {
            enabled: true,
            tls: true,
            hostname: "argo-ws." + config.require("hostnameSuffix"),
            annotations: {
                "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
            },
        },

        controller: {
            service: {
                annotations: {
                    "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
                },
            }
        },
        postgresql: {
            enabled: true,
            auth: {
                // bitnami bug, can not set username or database
                password: config.requireSecret("globalPostgresPassword")
            }
        }
    },
});

export const argoWorkflowsReleaseStatus = argoRelease.status;

