import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

// Deploy keycloak using the Helm chart
const keycloakRelease = new kubernetes.helm.v3.Release("keycloak", {
    name: "keycloak",
    chart: "oci://registry-1.docker.io/bitnamicharts/keycloak",
    version: "21.8.0",
    namespace: "keycloak",
    createNamespace: true,
    timeout: 600,
    values: {
        auth: {
            adminUser: "admin",
            adminPassword: config.requireSecret("keycloakAdminPassword")
        },
        ingress: {
            enabled: true,
            tls: true,
            hostname: "keycloak." + config.require("hostnameSuffix"),
            annotations: {
                "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
            },
        },
        production: true,
        proxy: "edge",
        postgresql: {
            enabled: true,
            auth: {
                postgresPassword: config.requireSecret("globalPostgresPassword"),
                username: "keycloak",
                password: config.requireSecret("globalPostgresPassword"),
                database: "keycloak"
            }
        }
    },
    
});


export const keycloakReleaseStatus = keycloakRelease.status;
