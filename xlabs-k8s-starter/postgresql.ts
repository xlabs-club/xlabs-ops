import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

// Deploy postgresql using the Helm chart
const helmRelease = new kubernetes.helm.v3.Release("postgresql", {
    name: "postgresql",
    chart: "oci://registry-1.docker.io/bitnamicharts/postgresql",
    version: "16.7.11",
    namespace: "postgresql",
    createNamespace: true,
    timeout: 600,
    values: {
        auth: {
            enablePostgresUser: true,
            postgresPassword: config.requireSecret("globalPostgresPassword"),
        },
        primary: {
            service: {
                type: "NodePort",
            }
        }
    },
});

export const postgresqlReleaseStatus = helmRelease.status;

