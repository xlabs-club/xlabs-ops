import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config("postgresql");

// Deploy postgresql using the Helm chart
const helmRelease = new kubernetes.helm.v3.Release("postgresql", {
    name: "postgresql",
    chart: "oci://registry-1.docker.io/bitnamicharts/postgresql",
    version: "15.2.5",
    namespace: "postgresql",
    createNamespace: true,
    timeout: 600,
    values: {
        auth: {
            // Assign a password to the "postgres" admin user.
            enablePostgresUser: true,
            postgresPassword: config.requireSecret("password"),
        }
    },
});

export const postgresqlReleaseStatus = helmRelease.status;

