import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

// 生成并替换 coredns-custom configmap，实现定制 coredns，将自定义的几个ingress域名转成内部IP，在K8S内部使用内网IP访问
// 这是一个很危险的动作，请在可控的集群才启用
// 需要重启 coredns 才能生效，请手动重启 kubectl -n kube-system rollout restart deployment coredns

let config = new pulumi.Config();
let coreDnsCustomHosts = pulumi.output("empty");;

if (config.getBoolean("corednsCustomEnabled")) {

    const coreDnsConfig = pulumi.all(
        [
            config.requireSecret("corednsCustomLocalIp"),
        ])
        .apply(([ip]) => {
            const hostnameSuffix = config.require("hostnameSuffix");
            // const hostPres = ["app", "iam", "opy"];
            const allHosts = ["app", "iam", "opy"].map(e => e + "." + hostnameSuffix).join(' ');
            const hosts = `
                ${hostnameSuffix} {
                    hosts {
                        ${ip} ${allHosts}
                        fallthrough
                    }
                }
                `;
            return hosts;
        });
    // Create a ConfigMap with the custom CoreDNS configuration
    const coreDnsConfigMap = new kubernetes.core.v1.ConfigMap("coredns-custom", {
        // ConfigMap 的 name 一定要是 coredns-custom 才能够被 coredns 的 deployment 识别并挂载。
        metadata: {
            name: "coredns-custom",
            namespace: "kube-system",
        },
        data: {
            "xlabs.server": coreDnsConfig,
        },
    });

    coreDnsCustomHosts = coreDnsConfigMap.data["xlabs.server"];
}

export const coreDnsConfig = coreDnsCustomHosts;


