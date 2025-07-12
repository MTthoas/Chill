interface Config {
  API_INTELLECT_AGENT_URL?: string;
  API_BASE_API_URL: string;
  LOCAL_IP_ADDRESS: string;
}

export const config: Config = {
  API_INTELLECT_AGENT_URL: process.env.EXPO_PUBLIC_API_INTELLECT_AGENT_URL,
  API_BASE_API_URL: process.env.EXPO_PUBLIC_API_BASE_API_URL!,
  LOCAL_IP_ADDRESS: process.env.EXPO_PUBLIC_LOCAL_IP_ADDRESS!,
};
