/**
 * GIF providers whose media we'll embed. GIFs are never uploaded: a message
 * stores the provider's own media URLs (KLIPY and GIPHY both require media
 * to be loaded straight from their CDN, unmodified).
 *
 * `hosts` is the allowlist a GIF's URLs must match, so a client can't use
 * the GIF feature to embed arbitrary third-party URLs (tracking pixels etc.).
 */
export const GIF_PROVIDERS = {
    klipy: {
        // static.klipy.com, static1.klipy.com, static2.klipy.com
        hosts: /^static\d*\.klipy\.com$/,
    },
    giphy: {
        // media.giphy.com, media0-4.giphy.com, i.giphy.com
        hosts: /^(media\d*|i)\.giphy\.com$/,
    },
};

export const GIF_PROVIDER_NAMES = Object.keys(GIF_PROVIDERS);
