class CLTLayerType {
    constructor(thickness, materialGrade, orientation) {
        this.thickness = thickness;
        this.materialGrade = materialGrade;
        this.orientation = orientation;
    }

    getE() {
        return this.orientation === 0 ? this.materialGrade.e : this.materialGrade.e90;
    }

    getG() {
        return this.orientation === 0 ? this.materialGrade.g : this.materialGrade.g90;
    }
}
