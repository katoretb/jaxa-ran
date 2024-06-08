const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');


// Constant value
const canvasWidth = 1920;
const canvasHeight = 960;
const canvas = createCanvas(canvasWidth, canvasHeight);
const ctx = canvas.getContext('2d');

// const minImages = 2;
// const maxImages = 6;

const areaXMin = 0;
const areaXMax = canvasWidth;
const areaYMin = 0;
const areaYMax = canvasHeight;

const BaseFolder = "mega_gen"
const BasePath = `./Generate/${BaseFolder}_dataset`

const train = `${BasePath}/${BaseFolder}_train`
const valid = `${BasePath}/${BaseFolder}_validate`

const train_ratio = 0.8

const setNum = 1000



const Template = "./Templates/Item1.png"

const ItemList = [
    "./Items/beaker.png",
    "./Items/goggle.png",
    "./Items/hammer.png",
    "./Items/kapton_tape.png",
    "./Items/pipette.png",
    "./Items/screwdriver.png",
    "./Items/thermometer.png",
    "./Items/top.png",
    "./Items/watch.png",
    "./Items/wrench.png"
]
// const center_x = 1100
// const center_y = 910

let startTime = performance.now();
let currentTime
let elapsedTime
let averageTimePerIteration
let estimatedTotalTime
let estimatedRemainingTime
let percentageComplete
let ti = 0

async function main(){
    for(let k = 0; k < (setNum*train_ratio);k++){
        for(let i = 0; i < 10;i++){
            // console.log(`${k} ${i}  _0`)
            await drawLevel23(Template, ItemList[i], i, k, train)
            fs.writeFileSync(`${train}/images/img_${k}_${i}_0.png`, canvas.toBuffer("image/png"));

            // console.log(`${k} ${i}  _1`)
            await drawLevel4(Template, ItemList[i], i, k, train)
            fs.writeFileSync(`${train}/images/img_${k}_${i}_1.png`, canvas.toBuffer("image/png"));
            await timing()
        }
    }

    for(let k = (setNum*train_ratio); k < ((setNum*(1-train_ratio))+(setNum*train_ratio));k++){
        for(let i = 0; i < 10;i++){
            // console.log(`${k} ${i}  _0`)
            await drawLevel23(Template, ItemList[i], i, k, valid)
            fs.writeFileSync(`${valid}/images/img_${k}_${i}_0.png`, canvas.toBuffer("image/png"));

            // console.log(`${k} ${i}  _1`)
            await drawLevel4(Template, ItemList[i], i, k, valid)
            fs.writeFileSync(`${valid}/images/img_${k}_${i}_1.png`, canvas.toBuffer("image/png"));
            await timing()
        }
    }
}

async function timing(){
    currentTime = performance.now();
    elapsedTime = (currentTime - startTime) / 1000;
    averageTimePerIteration = elapsedTime / (ti + 1);
    estimatedTotalTime = averageTimePerIteration * setNum*10;
    estimatedRemainingTime = estimatedTotalTime - elapsedTime;
    percentageComplete = ((ti + 1) / (setNum*10)) * 100;

    console.clear()
    console.log(`Progress:       ${percentageComplete.toFixed(4)}% (${ti+1}/${setNum*10})`);
    console.log(`Estimated Time: ${formatTime(elapsedTime)} / ${formatTime(estimatedTotalTime)}`);
    console.log(`Time left:      ${formatTime(estimatedRemainingTime)}`)
    ti++
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}:${minutes}:${remainingSeconds}`;
}

// async function drawLevel1(templatePath, imagePath, i, j, id){
//     const template = await loadImage(templatePath);
//     const image = await loadImage(imagePath);
//     const scale = 1.5

//     // Draw the template image onto the canvas
//     ctx.drawImage(template, 0, 0, canvasWidth, canvasHeight);

//     ctx.drawImage(image, center_x-(image.width*scale/2), center_y-(image.height*scale/2), image.width*scale, image.height*scale)

//     ctx.strokeStyle = 'red';
//     ctx.lineWidth = 5;
//     // ctx.strokeRect(center_x-(image.width*scale/2), center_y-(image.height*scale/2), image.width*scale, image.height*scale);
// }


class VOC {
    constructor(s, i ,t) {
        this.str = `<annotation>
        <folder>images</folder>
        <filename>img_${s}_${i}_${t}.png</filename>
        <path>C:\\Users\\sitth\\Desktop\\krpc-dataset\\Generate\\images\\img_${s}_${i}_${t}.png</path>
        <source>
            <database>Unknown</database>
        </source>
        <size>
            <width>${canvasWidth}</width>
            <height>${canvasHeight}</height>
            <depth>3</depth>
        </size>
        <segmented>0</segmented>
        `
        this.item = i
        this.set = s
        this.type = t
    }

    add(imagePath, x, y, boundingBoxWidth, boundingBoxHeight) {
        this.str += `  <object>
        <name>${imagePath.split("/")[2].replace(".png", "")}</name>
        <pose>Unspecified</pose>
        <truncated>0</truncated>
        <difficult>0</difficult>
        <bndbox>
            <xmin>${parseInt(x - boundingBoxWidth / 2)}</xmin>
            <ymin>${parseInt(y - boundingBoxHeight / 2)}</ymin>
            <xmax>${parseInt(boundingBoxWidth + (x - boundingBoxWidth / 2))}</xmax>
            <ymax>${parseInt(boundingBoxHeight + (y - boundingBoxHeight / 2))}</ymax>
        </bndbox>
    </object>
            `
    }

    write(path) {
        this.str += `</annotation>`
        fs.writeFileSync(`${path}/Annotations/img_${this.set}_${this.item}_${this.type}.xml`, this.str)
    }
}

class YOLO {
    constructor(s, i ,t){
        this.str = ""
        this.item = i
        this.set = s
        this.type = t
    }

    add(x, y, boundingBoxWidth, boundingBoxHeight) {
        const xmin = parseInt(x - boundingBoxWidth / 2)
        const xmax = parseInt(boundingBoxWidth + (x - boundingBoxWidth / 2))
        const ymin = parseInt(y - boundingBoxHeight / 2)
        const ymax = parseInt(boundingBoxHeight + (y - boundingBoxHeight / 2))


        this.str += `${this.item} ${((xmin + xmax) / 2 / canvasWidth).toFixed(7)} ${((ymin + ymax) / 2 / canvasHeight).toFixed(7)} ${((xmax - xmin) / canvasWidth).toFixed(7)} ${((ymax - ymin) / canvasHeight).toFixed(7)}\n`
    }

    write(path) {
        fs.writeFileSync(`${path}/labels/img_${this.set}_${this.item}_${this.type}.txt`, this.str)
    }
}


main()


async function drawLevel23(templatePath, imagePath, i, id, path, minImages = 1, maxImages = 6){
    const LVOC = new VOC(id, i, 0)
    const LYOLO = new YOLO(id, i, 0)

    const numImages = Math.floor(Math.random() * (maxImages - minImages + 1)) + minImages;
    const template = await loadImage(templatePath);
    const image = await loadImage(imagePath);

    // Get the original dimensions of the image
    const originalImageWidth = image.width;
    const originalImageHeight = image.height;

    // Draw the template image onto the canvas
    ctx.drawImage(template, 0, 0, canvasWidth, canvasHeight);

    // Function to check if a rectangle overlaps with any existing rectangles
    function isOverlapping(x, y, boundingBoxWidth, boundingBoxHeight, existingPositions) {
        for (const pos of existingPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        if (Math.abs(dx) < boundingBoxWidth && Math.abs(dy) < boundingBoxHeight) {
            return true;
        }
        }
        return false;
    }

    const positions = [];

    for (let i = 0; i < numImages; i++) {
        let x, y, rotationAngle, scaleFactor, imageWidth, imageHeight, boundingBoxWidth, boundingBoxHeight;

        let attempt = 0;
        let foundPosition = false;

        while (!foundPosition && attempt < 10) {
        attempt++;

        // Random rotation angle between 0 and 2π radians
        // rotationAngle = Math.random() * 2 * Math.PI;
        rotationAngle = Math.floor(Math.random() * 8) * Math.PI / 4;

        // Random scale factor between 0.5 and 1.5
        scaleFactor = Math.random() * 1.5 + 0.5;

        // Calculate scaled dimensions
        imageWidth = originalImageWidth * scaleFactor;
        imageHeight = originalImageHeight * scaleFactor;

        // Calculate the bounding box of the rotated and scaled image
        const cos = Math.abs(Math.cos(rotationAngle));
        const sin = Math.abs(Math.sin(rotationAngle));
        boundingBoxWidth = imageWidth * cos + imageHeight * sin;
        boundingBoxHeight = imageWidth * sin + imageHeight * cos;

        // Generate random position within the specified area
        x = Math.random() * (areaXMax - areaXMin - boundingBoxWidth) + areaXMin + boundingBoxWidth / 2;
        y = Math.random() * (areaYMax - areaYMin - boundingBoxHeight) + areaYMin + boundingBoxHeight / 2;

        if (!isOverlapping(x, y, boundingBoxWidth, boundingBoxHeight, positions)) {
            foundPosition = true;
        }
        }

        if (!foundPosition) {
            continue; // Skip to the next image
        }

        // Save the position
        positions.push({ x, y });

        // Save the canvas state
        ctx.save();

        // Move to the center of the image
        ctx.translate(x, y);
        // Rotate the canvas context
        ctx.rotate(rotationAngle);
        // Draw the rotated and scaled image (centering it at the translate origin)
        ctx.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);

        // Restore the canvas state
        ctx.restore();

        // Draw an upright rectangle to cover the rotated image's bounding box
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        // ctx.strokeRect(x - boundingBoxWidth / 2, y - boundingBoxHeight / 2, boundingBoxWidth, boundingBoxHeight);
        LVOC.add(imagePath, x, y, boundingBoxWidth, boundingBoxHeight)
        LYOLO.add(x, y, boundingBoxWidth, boundingBoxHeight)

    }


    LVOC.write(path)
    LYOLO.write(path)

    // const buffer = canvas.toBuffer("image/png");
    // fs.writeFileSync("./Generate/Images/image.png", buffer);
}

async function drawLevel4(templatePath, imagePath, i, id, path, minImages = 3, maxImages = 6){
    const LVOC = new VOC(id, i, 1)
    const LYOLO = new YOLO(id, i, 1)

    const numImages = Math.floor(Math.random() * (maxImages - minImages + 1)) + minImages;
    const template = await loadImage(templatePath);
    const image = await loadImage(imagePath);
  
    // Get the original dimensions of the image
    const originalImageWidth = image.width;
    const originalImageHeight = image.height;
  
    // Draw the template image onto the canvas
    ctx.drawImage(template, 0, 0, canvasWidth, canvasHeight);
  
    // Function to check if a rectangle overlaps with any existing rectangles
    function isOverlapping(x, y, boundingBoxWidth, boundingBoxHeight, existingPositions) {
      for (const pos of existingPositions) {
        const dx = Math.abs(x - pos.x);
        const dy = Math.abs(y - pos.y);
        const overlapX = boundingBoxWidth / 2 + pos.boundingBoxWidth / 2 - dx;
        const overlapY = boundingBoxHeight / 2 + pos.boundingBoxHeight / 2 - dy;
        if (overlapX > 0 && overlapY > 0 && overlapX < boundingBoxWidth && overlapY < boundingBoxHeight) {
          const overlapArea = overlapX * overlapY;
          const area1 = boundingBoxWidth * boundingBoxHeight;
          const area2 = pos.boundingBoxWidth * pos.boundingBoxHeight;
          const maxOverlapArea = Math.min(area1, area2) * 0.5;
          if (overlapArea > maxOverlapArea) {
            return true;
          }
        }
      }
      return false;
    }
  
    const positions = [];
  
    for (let i = 0; i < numImages; i++) {
      let x, y, rotationAngle, scaleFactor, imageWidth, imageHeight, boundingBoxWidth, boundingBoxHeight;
  
      let attempt = 0;
      let foundPosition = false;
  
      while (!foundPosition && attempt < 100) { // Attempt up to 100 times to find a position
        attempt++;
  
        // Random rotation angle between 0 and 2π radians
        // rotationAngle = Math.random() * 2 * Math.PI;
        rotationAngle = Math.floor(Math.random() * 8) * Math.PI / 4;
  
        // Random scale factor between 0.5 and 1.5
        scaleFactor = Math.random() * 1 + 0.5;
  
        // Calculate scaled dimensions
        imageWidth = originalImageWidth * scaleFactor;
        imageHeight = originalImageHeight * scaleFactor;
  
        // Calculate the bounding box of the rotated and scaled image
        const cos = Math.abs(Math.cos(rotationAngle));
        const sin = Math.abs(Math.sin(rotationAngle));
        boundingBoxWidth = imageWidth * cos + imageHeight * sin;
        boundingBoxHeight = imageWidth * sin + imageHeight * cos;
  
        // Generate random position within the specified area
        x = Math.random() * (areaXMax - areaXMin - boundingBoxWidth) + areaXMin + boundingBoxWidth / 2;
        y = Math.random() * (areaYMax - areaYMin - boundingBoxHeight) + areaYMin + boundingBoxHeight / 2;
  
        // Check for overlap with existing positions
        if (positions.length > 0 && isOverlapping(x, y, boundingBoxWidth, boundingBoxHeight, positions)) {
          continue; // Skip if there's overlap
        }
  
        foundPosition = true;
      }
  
      // Save the position
      positions.push({ x, y, boundingBoxWidth, boundingBoxHeight });
  
      // Save the canvas state
      ctx.save();
  
      // Move to the center of the image
      ctx.translate(x, y);
      // Rotate the canvas context
      ctx.rotate(rotationAngle);
      // Draw the rotated and scaled image (centering it at the translate origin)
      ctx.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  
      // Restore the canvas state
      ctx.restore();
  
      // Draw an upright rectangle to cover the rotated image's bounding box
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 5;
    //   ctx.strokeRect(x - boundingBoxWidth / 2, y - boundingBoxHeight / 2, boundingBoxWidth, boundingBoxHeight);
  
      // Save the canvas to a file for this image
      LVOC.add(imagePath, x, y, boundingBoxWidth, boundingBoxHeight)
      LYOLO.add(x, y, boundingBoxWidth, boundingBoxHeight)

    }

    LVOC.write(path)
    LYOLO.write(path)
}
