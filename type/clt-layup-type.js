class CLTLayupType {
    constructor() {
        this.name = 'CLT Layup';
        this.layers = [];
    }

    addLayer(layer) {
        this.layers.push(layer);
    }

    removeLayer(index) {
        this.layers.splice(index, 1);
    }

    getLayers() {
        return this.layers;
    }

    getLayerCount() {
        return this.layers.length;
    }

    getTotalThickness() {
        return this.layers.reduce((sum, layer) => sum + layer.thickness, 0);
    }

    isSymmetric() {
        const n = this.layers.length;
        for (let i = 0; i < Math.floor(n / 2); i++) {
            const top = this.layers[i];
            const bottom = this.layers[n - 1 - i];
            if (top.thickness !== bottom.thickness ||
                top.orientation !== bottom.orientation ||
                top.materialGrade.name !== bottom.materialGrade.name) {
                return false;
            }
        }
        return true;
    }
}
