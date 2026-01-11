// Fixed: Removed broken reference to vite/client and added process.env declaration
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};