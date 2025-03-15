import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

// Deploy keycloak using the Helm chart

const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("keycloakAdminUser"),
        config.requireSecret("keycloakAdminPassword"),
        config.requireSecret("globalPostgresPassword")
    ])
    .apply(([adminUser, adminPwd, postgrePwd]) => {
        const replaceVars = {
            hostname: "iam." + config.require("hostnameSuffix"),
            adminUser: adminUser,
            adminPassword: adminPwd,
            postgresPassword: postgrePwd
        }
        return new pulumi.asset.StringAsset(ejs.renderFile("./keycloak.values.yaml", replaceVars));
    });

const keycloakRelease = new kubernetes.helm.v3.Release("keycloak", {
    name: "keycloak",
    chart: "oci://registry-1.docker.io/bitnamicharts/keycloak",
    version: "24.4.13",
    namespace: "keycloak",
    createNamespace: true,
    timeout: 600,
    maxHistory: 10,
    valueYamlFiles: [valueYamlAsset]
});


export const keycloakReleaseStatus = keycloakRelease.status;
