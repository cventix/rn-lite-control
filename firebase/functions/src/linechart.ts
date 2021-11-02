// Modified version of https://github.com/soggotheslitherer/LineChart.js

/* tslint:disable */

export const LineChart = {
  lineNames: ['line1', 'line2'], // 数据线名称数组
  lineColors: ['red', '#003300'], // 数据线颜色数组
  dotColor: '#333', // 点的颜色;
  showBgLines: true, // 是否展示背景的梯度线
  fontX_axis: 'normal 15px Arial', // x轴字体
  fontY_axis: 'normal 18px Arial', // y轴字体
  fontLineName: 'normal 15px Arial', // 坐标线描述文字字体
  bgLineColor: '#bbb', // 背景线颜色
  yPaddingTop: 85, // 最顶梯度的留白高度
  yPaddingBottom: 40, // 最底梯度的留白高度
  unitLengthX: 50, // x轴单位长度
  axisMargin: 60, // 坐标轴距画布边缘的距离
  canvasH: 400, // canvas高度

  nodeList: undefined, // 需要绘制的点列
  yGradient1: undefined, // 左边y轴梯度值
  yGradient2: undefined, // 右边y轴梯度值（仅需要一条y轴时，不传该值即可）
  yGradient3: undefined,

  init(paramMap) {
    this.title = paramMap.title;
    this.lineNames = paramMap.lineNames || this.lineNames;
    this.lineColors = paramMap.lineColors || this.lineColors;
    this.dotColor = paramMap.dotColor || this.dotColor;
    this.showBgLines = paramMap.showBgLines || this.showBgLines;
    this.fontX_axis = paramMap.fontX_axis || this.fontX_axis;
    this.fontY_axis = paramMap.fontY_axis || this.fontY_axis;
    this.fontLineName = paramMap.fontLineName || this.fontLineName;
    this.bgLineColor = paramMap.bgLineColor || this.bgLineColor;
    this.yPaddingTop = paramMap.yPaddingTop || this.yPaddingTop;
    this.yPaddingBottom = paramMap.yPaddingBottom || this.yPaddingBottom;
    this.unitLengthX = paramMap.unitLengthX || this.unitLengthX;
    this.axisMargin = paramMap.axisMargin || this.axisMargin;
    this.canvasH = paramMap.canvasH || this.canvasH;
    this.xLegend = paramMap.xLegend;

    this.nodeList = paramMap.nodeList;
    this.yGradient1 = paramMap.yGradient1;
    this.yGradient2 = paramMap.yGradient2;
    this.yGradient3 = paramMap.yGradient3;
    this.yCount = typeof this.yGradient2 === 'undefined' ? 1 : 2;

    this.canvas = paramMap.canvas;
    // this.canvas = document.getElementById(paramMap.canvasId) //获得dom
    this.context = this.canvas.getContext('2d'); // canvas画布
    this.canvas.height = this.canvasH;
    this.canvas.width = this.nodeList.length * this.unitLengthX + this.axisMargin * this.yCount;

    // Add white background
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = this.dotColor;

    this.minY1 = this.getExtremum().min1; // y轴梯度线的最值
    this.maxY1 = this.getExtremum().max1;
    if (this.yCount == 2) {
      this.minY2 = this.getExtremum().min2;
      this.maxY2 = this.getExtremum().max2;
    }
    this.pixelsPerBgLine = this.getYPixel().pixelsPerBgLine; // 每个梯度的像素数
    this.yBgLinesCount = this.getYPixel().yBgLinesCount; // y轴梯度数目

    if (this.title) {
      this.drawTitle();
    }
    if (this.xLegend) {
      this.drawXLegend();
    }

    this.drawAxis();
    this.drawLines();
  },

  drawAxis() {
    this.context.lineWidth = 2;
    this.context.strokeStyle = 'rgba(0,0,0,1)';
    // 换坐标轴直线
    this.context.beginPath();
    this.context.moveTo(this.axisMargin, 0);
    this.context.lineTo(this.axisMargin, this.canvas.height - this.axisMargin);
    this.context.lineTo(
      this.canvas.width - this.axisMargin * (this.yCount - 1),
      this.canvas.height - this.axisMargin,
    );
    if (this.yCount == 2) {
      this.context.lineTo(this.canvas.width - this.axisMargin, 0);
    }
    this.context.stroke();
    this.context.closePath();
    // 画x轴下方描述
    this.context.beginPath();
    this.context.textAlign = 'center'; // x轴文字居中写
    this.context.font = this.fontX_axis;
    for (let i = 0; i < this.nodeList.length; i++) {
      const x_x = this.axisMargin + this.unitLengthX * (i + 0.5);
      const x_y = this.canvas.height - this.axisMargin + 20;
      this.context.fillText(this.nodeList[i].x, x_x, x_y, this.unitLengthX);
    }
    // 画左y轴左方描述
    this.context.textAlign = 'right'; // y轴文字靠右写
    this.context.font = this.fontY_axis;
    this.context.textBaseline = 'middle'; // 文字的中心线的调整
    for (let i = 0; i < this.yBgLinesCount; i++) {
      this.context.fillStyle = this.lineColors[0];
      this.context.fillText(
        this.minY1 + i * this.yGradient1,
        this.axisMargin - 10,
        (this.yBgLinesCount - 1 - i) * this.pixelsPerBgLine + this.yPaddingTop,
        this.unitLengthX,
      );
    }
    // 画右y轴右方描述
    if (this.yCount == 2) {
      this.context.textAlign = 'left';
      for (let i = 0; i < this.yBgLinesCount; i++) {
        this.context.fillStyle = this.lineColors[1];
        this.context.fillText(
          this.minY2 + i * this.yGradient2,
          this.canvas.width - this.axisMargin + 10,
          (this.yBgLinesCount - 1 - i) * this.pixelsPerBgLine + this.yPaddingTop,
          this.unitLengthX,
        );
      }
    }
    // 绘制背景线
    if (this.showBgLines) {
      const x = this.axisMargin;
      this.context.lineWidth = 1;
      this.context.strokeStyle = this.bgLineColor;
      for (let i = 0; i < this.yBgLinesCount; i++) {
        const y = (this.yBgLinesCount - 1 - i) * this.pixelsPerBgLine + this.yPaddingTop;
        this.context.moveTo(x, y);
        this.context.lineTo(this.canvas.width - this.axisMargin * (this.yCount - 1), y);
        this.context.stroke();
      }
    }
    this.context.closePath();
  },

  drawLines() {
    // 绘制数据线和数据点
    for (let j = 0; j < 3; j++) {
      // 绘制数据线
      this.context.beginPath();
      this.context.lineWidth = '2';
      this.context.strokeStyle = this.lineColors[j];
      for (let i = 0; i < this.nodeList.length; i++) {
        const x = this.axisMargin + this.unitLengthX * (i + 0.5);
        let y = 0;
        if (j == 0) {
          y = this.getCoordY1(this.nodeList[i].y1);
        } else if (j == 1) {
          y = this.getCoordY2(this.nodeList[i].y2);
        } else {
          y = this.getCoordY3(this.nodeList[i].y3);
        }
        this.context.lineTo(x, y);
      }
      this.context.stroke();
      this.context.closePath();
      // 绘制数据线上的点
      this.context.beginPath();
      this.context.fillStyle = this.dotColor;
      for (let i = 0; i < this.nodeList.length; i++) {
        const x = this.axisMargin + this.unitLengthX * (i + 0.5);
        let y = 0;
        if (j == 0) {
          y = this.getCoordY1(this.nodeList[i].y1);
        } else if (j == 1) {
          y = this.getCoordY2(this.nodeList[i].y2);
        } else {
          y = this.getCoordY3(this.nodeList[i].y3);
        }
        this.context.moveTo(x, y);
        this.context.arc(x, y, 3, 0, Math.PI * 2, true); // 绘制数据线上的点
        this.context.fill();
      }
      this.context.closePath();
      // 绘制折线名称
      this.drawLineName(j);
    }
  },

  getCoordY1(valueY) {
    const y = ((valueY - this.minY1) * this.pixelsPerBgLine) / this.yGradient1;
    return this.canvas.height - this.axisMargin - this.yPaddingBottom - y;
  }, // 纵坐标Y(注意 纵坐标的算法是倒着的因为原点在最上面)
  getCoordY2(valueY) {
    if (this.yCount == 1) {
      return this.getCoordY1(valueY);
    }
    const y = ((valueY - this.minY2) * this.pixelsPerBgLine) / this.yGradient2;
    return this.canvas.height - this.axisMargin - this.yPaddingBottom - y;
  }, // 纵坐标Y(注意 纵坐标的算法是倒着的因为原点在最上面)
  getCoordY3(valueY) {
    if (this.yCount == 1) {
      return this.getCoordY1(valueY);
    }
    const y = ((valueY - this.minY3) * this.pixelsPerBgLine) / this.yGradient3;
    return this.canvas.height - this.axisMargin - this.yPaddingBottom - y;
  }, // 纵坐标Y(注意 纵坐标的算法是倒着的因为原点在最上面)
  getYPixel() {
    // let yBgLinesCount = parseInt((this.maxY1 - this.minY1) / this.yGradient1) + 1;
    let yBgLinesCount = (this.maxY1 - this.minY1) / this.yGradient1 + 1;
    if (this.yCount == 2) {
      const yBgLinesCount2 = (this.maxY2 - this.minY2) / this.yGradient2 + 1;
      if (yBgLinesCount < yBgLinesCount2) {
        yBgLinesCount = yBgLinesCount2;
      }
    }
    if (this.yCount == 3) {
      const yBgLinesCount3 = (this.maxY3 - this.minY3) / this.yGradient3 + 1;
      if (yBgLinesCount < yBgLinesCount3) {
        yBgLinesCount = yBgLinesCount3;
      }
    }
    return {
      pixelsPerBgLine:
        (this.canvas.height - this.axisMargin - this.yPaddingBottom - this.yPaddingTop) /
        (yBgLinesCount - 1),
      yBgLinesCount,
    };
  }, // yBgLinesCount:y轴梯度数目,pixelsPerBgLine:每个梯度的像素数
  getExtremum() {
    let max1 = parseFloat(this.nodeList[0].y1),
      min1 = parseFloat(this.nodeList[0].y1),
      max2 = parseFloat(this.nodeList[0].y2),
      min2 = parseFloat(this.nodeList[0].y2),
      max3 = parseFloat(this.nodeList[0].y3),
      min3 = parseFloat(this.nodeList[0].y3);
    for (let i = 0; i < this.nodeList.length; i++) {
      if (parseFloat(this.nodeList[i].y1) > max1) {
        max1 = parseFloat(this.nodeList[i].y1);
      }
      if (parseFloat(this.nodeList[i].y1) < min1) {
        min1 = parseFloat(this.nodeList[i].y1);
      }
      if (parseFloat(this.nodeList[i].y2) > max2) {
        max2 = parseFloat(this.nodeList[i].y2);
      }
      if (parseFloat(this.nodeList[i].y2) < min2) {
        min2 = parseFloat(this.nodeList[i].y2);
      }
      if (parseFloat(this.nodeList[i].y3) > max3) {
        max3 = parseFloat(this.nodeList[i].y3);
      }
      if (parseFloat(this.nodeList[i].y3) < min3) {
        min3 = parseFloat(this.nodeList[i].y3);
      }
    }
    if (this.yCount == 1) {
      max1 = max1 > max2 ? max1 : max2;
      min1 = min1 < min2 ? min1 : min2;

      if (max2 > max1) {
        max1 = max2;
      }
      if (max3 > max1) {
        max1 = max3;
      }
      if (min2 < min1) {
        min1 = min2;
      }
      if (min3 < min1) {
        min1 = min3;
      }
      if (min1 === 0 && max1 === 0) {
        min1 = 0;
        max1 = 50;
      }
      return {
        max1: Math.ceil(max1 / this.yGradient1) * this.yGradient1,
        min1: Math.floor(min1 / this.yGradient1) * this.yGradient1,
      };
    }
    return {
      max1: Math.ceil(max1 / this.yGradient1) * this.yGradient1,
      min1: Math.floor(min1 / this.yGradient1) * this.yGradient1,
      max2: Math.ceil(max2 / this.yGradient2) * this.yGradient2,
      min2: Math.floor(min2 / this.yGradient2) * this.yGradient2,
      max3: Math.ceil(max3 / this.yGradient3) * this.yGradient3,
      min3: Math.floor(min3 / this.yGradient3) * this.yGradient3,
    };
  }, // 获得y轴梯度线的最值

  drawLineName(lineindex) {
    const x = this.axisMargin + 10;
    const y = 20 * lineindex + 10;
    this.context.beginPath();
    this.context.textAlign = 'left';
    this.context.strokeStyle = this.lineColors[lineindex];
    this.context.font = this.fontLineName;
    this.context.moveTo(x, y);
    this.context.lineTo(x + 50, y);
    this.context.stroke();
    this.context.fillText(this.lineNames[lineindex], x + 60, y, 150);
    this.context.closePath();
  },

  drawTitle() {
    const x = this.canvas.width / 2 - this.context.measureText(this.title).width / 2;
    const y = 20;
    this.context.beginPath();
    this.context.textAlign = 'left';
    this.context.strokeStyle = '#000';
    this.context.font = this.fontLineName;
    this.context.moveTo(x, y);
    this.context.stroke();
    this.context.fillText(this.title, x, y);
    this.context.closePath();
  },

  drawXLegend() {
    const x = this.canvas.width / 2 - this.context.measureText(this.xLegend).width / 2;
    const y = this.canvas.height - 10;
    console.log('X and Y', x, y);
    this.context.beginPath();
    this.context.textAlign = 'left';
    this.context.strokeStyle = '#000';
    this.context.font = this.fontLineName;
    this.context.moveTo(x, y);
    this.context.stroke();
    this.context.fillText(this.xLegend, x, y);
    this.context.closePath();
  },
};
