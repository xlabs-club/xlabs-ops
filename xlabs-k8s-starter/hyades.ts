// Homepage: https://github.com/DependencyTrack/hyades
import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();


const hyadesPgRelease = new kubernetes.helm.v3.Release("postgresql", {
    name: "postgresql",
    chart: "oci://registry-1.docker.io/bitnamicharts/postgresql",
    version: "16.3.3",
    namespace: "hyades",
    createNamespace: true,
    timeout: 600,
    values: {
        auth: {
            // Assign a password to the "postgres" admin user.
            enablePostgresUser: true,
            postgresPassword: config.requireSecret("globalPostgresPassword"),
            username: "hyades",
            password: config.requireSecret("globalPostgresPassword"),
            database: "hyades",
        }
    },
});

const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("globalPostgresPassword")
    ])
    .apply(([postgrePwd]) => {
        const replaceVars = {
            hostname: "hyades." + config.require("hostnameSuffix"),
            postgresPassword: postgrePwd
        }
        return new pulumi.asset.StringAsset(ejs.renderFile("./hyades.values.yaml", replaceVars));
    });


const hyadesRelease = new kubernetes.helm.v3.Release("hyades", {
    name: "hyades",
    chart: "hyades",
    version: "0.10.0",
    namespace: "hyades",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://dependencytrack.github.io/helm-charts",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const hyadesPgReleaseStatus = hyadesPgRelease.status;
export const hyadesReleaseStatus = hyadesRelease.status;
