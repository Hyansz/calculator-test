class PanelProperties {
    calculate(cltLayup, beff = 1000) {
        throw new Error('Must be implemented by subclass');
    }
}

class ShearAnalogyMethod extends PanelProperties {
    calculate(cltLayup, beff = 1000) {
        const layers = cltLayup.getLayers();
        const n = layers.length;

        if (n < 3 || n > 9) {
            throw new Error('Shear Analogy memerlukan 3-9 layer');
        }

        if (!cltLayup.isSymmetric()) {
            throw new Error('Shear Analogy memerlukan susunan simetris dari atas ke bawah');
        }

        const result = new PanelPropertiesType();
        result.beff = beff;
        result.totalThickness = cltLayup.getTotalThickness();

        const totalH = result.totalThickness;
        const halfH = totalH / 2;

        let cumulativeFromBottom = 0;
        let eiTotal = 0;

        for (let i = 0; i < n; i++) {
            const layer = layers[i];
            const props = new CLTLayerPropertiesType();

            props.ti = layer.thickness;
            props.orientation = layer.orientation;

            cumulativeFromBottom += layer.thickness / 2;
            props.yi = cumulativeFromBottom;
            cumulativeFromBottom += layer.thickness / 2;

            props.eiXX = layer.orientation === 0 ? layer.getE() : 0;
            props.hi = totalH + props.ti - props.yi;
            props.gi = layer.getG();

            props.beffTi3Over12 = beff * Math.pow(props.ti, 3) / 12;
            props.tiBeffHi2 = props.ti * beff * Math.pow(props.hi, 2);
            props.eiIi = (props.beffTi3Over12 + props.tiBeffHi2) * props.eiXX;

            eiTotal += props.eiIi;
            result.layers.push(props);
        }

        result.eiEff = eiTotal;
        return result;
    }
}

class GammaMethod extends PanelProperties {
    calculate(cltLayup, beff = 1000, lengthM = 5) {
        const layers = cltLayup.getLayers();
        const n = layers.length;

        if (n !== 3 && n !== 5) {
            throw new Error('Gamma Method hanya bisa untuk 3 atau 5 layer');
        }

        const result = new PanelPropertiesType();
        result.beff = beff;
        result.totalThickness = cltLayup.getTotalThickness();

        const totalH = result.totalThickness;
        const halfH = totalH / 2;
        const Lref = lengthM * 1000;

        let cumulativeFromBottom = 0;
        const layerProps = [];

        for (let i = 0; i < n; i++) {
            const layer = layers[i];
            const props = new CLTLayerPropertiesType();

            props.ti = layer.thickness;
            props.orientation = layer.orientation;

            cumulativeFromBottom += layer.thickness / 2;
            props.yi = cumulativeFromBottom;
            cumulativeFromBottom += layer.thickness / 2;

            props.eiXX = layer.orientation === 0 ? layer.getE() : 0;
            props.hi = totalH + props.ti - props.yi;
            props.gi = layer.getG();

            props.beffTi3Over12 = beff * Math.pow(props.ti, 3) / 12;
            props.tiBeffHi2 = props.ti * beff * Math.pow(props.hi, 2);

            layerProps.push(props);
        }

        if (n === 5) {
            this._calcGamma5(layerProps, beff, Lref);
        } else {
            this._calcGamma3(layerProps, beff, Lref);
        }

        let eiTotal = 0;
        for (const props of layerProps) {
            const aSquared = props.a !== undefined ? Math.pow(props.a, 2) : 0;
            props.tiBeffHi2 = props.ti * beff * aSquared;
            props.eiIi = (props.beffTi3Over12 + props.gamma * props.tiBeffHi2) * props.eiXX;
            eiTotal += props.eiIi;
        }

        result.eiEff = eiTotal;
        result.layers = layerProps;
        return result;
    }

    _calcGamma5(layerProps, beff, Lref) {
        const t = layerProps.map(p => p.ti);
        const E = layerProps.map(p => p.eiXX || layerProps[0].eiXX);
        const G = layerProps.map(p => p.gi);

        const d1 = beff / t[1];
        const d3 = beff / t[3];

        const g1 = d1 === 0 ? 0 : 1 / (1 + Math.pow(Math.PI, 2) * E[0] * t[0] / (d1 * G[1] * Math.pow(Lref, 2)));
        const g3 = d3 === 0 ? 0 : 1 / (1 + Math.pow(Math.PI, 2) * E[4] * t[4] / (d3 * G[3] * Math.pow(E[0], 2)));

        const a2Num = g1 * E[0] * beff * t[0] * (t[0] / 2 + t[1] + t[2] / 2)
                    - g3 * E[4] * beff * t[4] * (t[2] / 2 + t[3] + t[4] / 2);
        const a2Den = g1 * E[0] * beff * t[0] + 1 * E[2] * beff * t[2] + g3 * E[4] * beff * t[4];
        const a2 = a2Den === 0 ? 0 : a2Num / a2Den;

        const a1 = (t[0] / 2 + t[1] + t[2] / 2) - a2;
        const a3 = (t[2] / 2 + t[3] + t[4] / 2) + a2;

        layerProps[0].gamma = g1;
        layerProps[0].a = a1;
        layerProps[1].gamma = 0;
        layerProps[1].a = 0;
        layerProps[2].gamma = 1;
        layerProps[2].a = a2;
        layerProps[3].gamma = 0;
        layerProps[3].a = 0;
        layerProps[4].gamma = g3;
        layerProps[4].a = a3;
    }

    _calcGamma3(layerProps, beff, Lref) {
        const t = layerProps.map(p => p.ti);
        const E = layerProps.map(p => p.eiXX || layerProps[0].eiXX);
        const G = layerProps.map(p => p.gi);

        const d1 = beff / t[1];

        const g1 = d1 === 0 ? 0 : 1 / (1 + Math.pow(Math.PI, 2) * E[0] * t[0] / (d1 * G[1] * Math.pow(Lref, 2)));

        const a2Num = g1 * E[0] * beff * t[0] * (t[0] / 2 + t[1] + t[2] / 2);
        const a2Den = g1 * E[0] * beff * t[0] + 1 * E[2] * beff * t[2];
        const a2 = a2Den === 0 ? 0 : a2Num / a2Den;
        const a1 = (t[0] / 2 + t[1] + t[2] / 2) - a2;

        layerProps[0].gamma = g1;
        layerProps[0].a = a1;
        layerProps[1].gamma = 0;
        layerProps[1].a = 0;
        layerProps[2].gamma = 1;
        layerProps[2].a = a2;
    }
}
