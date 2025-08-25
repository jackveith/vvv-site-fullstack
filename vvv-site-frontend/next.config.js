
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    webpack: (config, context) => {
        if (process.env.NEXT_WEBPACK_USEPOLLING) {
            config.watchOptions ={
                poll: 1000,
                aggregateTimeout: 300,
            }
        }
        return config
    }
};

module.exports = nextConfig;
