'use strict'

const {
  app,
  dialog
} = require('electron').remote;
const {
  nativeImage
} = require('electron');
const fs = node('fs');
const path = node('path');
const pify = require('pify');
const mkdir = require('mkdirp');

const mkdirp = pify(mkdir);

const maxLength = 25;

const getFilename = (name) => {
  return name.replace(/^.*[\\\/]/, '');
};

const getDirname = (filepath) => {
  return path.dirname(filepath);
};

const buildFilename = (filepath, postfix) => {
  return getFilename(filepath).replace(/\.[^/.]+$/, '') + postfix + '.png';
};

const shortenText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.substr(0, maxLength - 3) + '…';
  }
  return text;
};

const androidButton = document.getElementById('android');
const iosButton = document.getElementById('ios');

androidButton.addEventListener('click', () => {
  androidButton.classList.toggle('none');
});

iosButton.addEventListener('click', () => {
  iosButton.classList.toggle('none');
});

const checkBoxElement = document.getElementById('checkBox');

const directoryElement = document.getElementById('directory');

const defaultDirectory = app.getPath('downloads');
// Set default directory
directoryElement.innerHTML = shortenText(defaultDirectory, maxLength);
directoryElement.setAttribute('data-attr', defaultDirectory);

const changeDirectoryElement = document.getElementById('change-directory');

changeDirectoryElement.addEventListener('click', function() {
  dialog.showOpenDialog({
    properties: ['openDirectory'],
  }, (directoryPath) => {
    console.log(directoryPath);
    if (directoryPath && directoryPath.length > 0) {
      directoryElement.innerHTML = shortenText(directoryPath[0], maxLength);
      directoryElement.setAttribute('data-attr', directoryPath[0]);
    }
  });
});

const iconOptions = [{
  name: '@4x',
  dimension: 1,
  android: {
    name: '',
    path: 'Android/drawable-xxxhdpi',
  },
  ios: {
    name: '@4x',
    path: 'iOS',
  },
}, {
  name: '@3x',
  dimension: 3 / 4,
  android: {
    name: '',
    path: 'Android/drawable-xxhdpi',
  },
  ios: {
    name: '@3x',
    path: 'iOS',
  },
}, {
  name: '@2x',
  dimension: 1 / 2,
  android: {
    name: '',
    path: 'Android/drawable-xhdpi',
  },
  ios: {
    name: '@2x',
    path: 'iOS',
  },
}, {
  name: '',
  dimension: 1 / 4,
  android: {
    name: '',
    path: 'Android/drawable-hdpi',
  },
  ios: {
    name: '',
    path: 'iOS',
  },
}];


let selectedFiles = [];

const openFileElement = document.getElementById('putimg');
openFileElement.addEventListener('click', function() {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{
      name: 'Images',
      extensions: ['jpeg', 'jpg', 'png'],
    }],
  }, (files) => {
    console.log('File paths:', files);
    if (files && files.length === 0) {
      return false;
    }

    selectedFiles = files;
    return true;
  });
});

openFileElement.ondragover = () => {
  console.log('ondragover');
  openFileElement.classList.add('putimg__drop');
  return false;
};

openFileElement.ondragleave = () => {
  console.log('ondragleave');
  openFileElement.classList.remove('putimg__drop');
  return false;
};

openFileElement.ondragend = () => {
  console.log('ondragend');
  return false;
};

openFileElement.ondrop = (e) => {
  e.preventDefault();

  console.log(e.dataTransfer.files);
  selectedFiles = [...e.dataTransfer.files]
    .filter(file => file.type === 'image/png' || file.type === 'image/jpeg')
    .map(file => file.path);
  console.log(selectedFiles);

  return false;
};


const generateElement = document.getElementById('download');
generateElement.addEventListener('click', function() {
  if (directoryElement.getAttribute('data-attr') === '') {
    alert('Please select save directory');
    return false;
  }

  if (selectedFiles && selectedFiles.length === 0) {
    alert('Please select some image(s)');
    return false;
  }

  selectedFiles.forEach(filePath => {
    console.log(filePath);
    let image = nativeImage.createFromPath(filePath);
    console.log('Original', image.getSize());

    let {
      width,
      height
    } = image.getSize();

    iconOptions.forEach(iconOption => {
      let tempImage = nativeImage.createFromPath(filePath);
      tempImage = tempImage.resize({
        width: Math.ceil(width * iconOption.dimension),
        height: Math.ceil(height * iconOption.dimension)
      });
      console.log(iconOption, tempImage.getSize());

      let newName = buildFilename(filePath, iconOption.name);
      console.log(newName);

      const saveDirectory = directoryElement.getAttribute('data-attr') + '/';
      if (!androidButton.classList.contains('none')) {
        console.log('Save directory', saveDirectory + iconOption.android.path);
        mkdirp(saveDirectory + iconOption.android.path).then(() => {
          fs.writeFile(saveDirectory + iconOption.android.path + '/' + newName, tempImage.toPNG(), function(err) {
            if (err)
              throw err;
            console.log('It\'s saved!');
          });
        });
      }

      if (!iosButton.classList.contains('none')) {
        console.log('Save directory', saveDirectory + iconOption.ios.path);
        mkdirp(saveDirectory + iconOption.ios.path).then(() => {
          fs.writeFile(saveDirectory + iconOption.ios.path + '/' + newName, tempImage.toPNG(), function(err) {
            if (err)
              throw err;
            console.log('It\'s saved!');
          });
        });
      }
    });

    alert('Done!');
  });
});
