/// <reference path="../../built/pxtlib.d.ts" />
/// <reference path="./field_asset.ts" />


namespace pxtblockly {
    export interface FieldSpriteEditorOptions {
        // Deprecated
        sizes: string;

        // Index of initial color (defaults to 1)
        initColor: string;

        initWidth: string;
        initHeight: string;

        disableResize: string;

        filter?: string;
    }

    interface ParsedSpriteEditorOptions {
        initColor: number;
        initWidth: number;
        initHeight: number;
        disableResize: boolean;
        filter?: string;
    }

    export class FieldSpriteEditor extends FieldAssetEditor<FieldSpriteEditorOptions, ParsedSpriteEditorOptions> {
        protected getAssetType(): pxt.AssetType {
            return pxt.AssetType.Image;
        }

        protected createNewAsset(text?: string): pxt.Asset {
            const project = pxt.react.getTilemapProject();
            if (text) {
                const match = /^\s*assets\s*\.\s*image\s*`([^`]+)`\s*$/.exec(text);
                if (match) {
                    const asset = project.lookupAssetByName(pxt.AssetType.Image, match[1].trim());
                    if (asset) return asset;
                }
            }

            const bmp = text ? pxt.sprite.imageLiteralToBitmap(text) : new pxt.sprite.Bitmap(this.params.initWidth, this.params.initHeight);
            const newAsset = project.createNewProjectImage(bmp.data());
            return newAsset;
        }

        protected getValueText(): string {
            if (this.asset && !this.isTemporaryAsset()) return `assets.image\`${this.asset.meta.displayName || this.asset.id.substr(this.asset.id.lastIndexOf(".") + 1)}\``;
            return pxt.sprite.bitmapToImageLiteral(this.asset && pxt.sprite.Bitmap.fromData((this.asset as pxt.ProjectImage).bitmap), pxt.editor.FileType.TypeScript);
        }

        protected parseFieldOptions(opts: FieldSpriteEditorOptions): ParsedSpriteEditorOptions {
            return parseFieldOptions(opts);
        }
    }

    function parseFieldOptions(opts: FieldSpriteEditorOptions) {
        // NOTE: This implementation is duplicated in pxtcompiler/emitter/service.ts
        // TODO: Refactor to share implementation.
        const parsed: ParsedSpriteEditorOptions = {
            initColor: 1,
            initWidth: 16,
            initHeight: 16,
            disableResize: false,
        };

        if (!opts) {
            return parsed;
        }

        if (opts.sizes) {
            const pairs = opts.sizes.split(";");
            const sizes: [number, number][] = [];
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split(",");
                if (pair.length !== 2) {
                    continue;
                }

                let width = parseInt(pair[0]);
                let height = parseInt(pair[1]);

                if (isNaN(width) || isNaN(height)) {
                    continue;
                }

                const screenSize = pxt.appTarget.runtime && pxt.appTarget.runtime.screenSize;
                if (width < 0 && screenSize)
                    width = screenSize.width;
                if (height < 0 && screenSize)
                    height = screenSize.height;

                sizes.push([width, height]);
            }
            if (sizes.length > 0) {
                parsed.initWidth = sizes[0][0];
                parsed.initHeight = sizes[0][1];
            }
        }

        if (opts.filter) {
            parsed.filter = opts.filter;
        }

        if (opts.disableResize) {
            parsed.disableResize = opts.disableResize.toLowerCase() === "true" || opts.disableResize === "1";
        }

        parsed.initColor = withDefault(opts.initColor, parsed.initColor);
        parsed.initWidth = withDefault(opts.initWidth, parsed.initWidth);
        parsed.initHeight = withDefault(opts.initHeight, parsed.initHeight);

        return parsed;

        function withDefault(raw: string, def: number) {
            const res = parseInt(raw);
            if (isNaN(res)) {
                return def;
            }
            return res;
        }
    }
}
