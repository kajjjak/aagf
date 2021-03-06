fileUtils = function() {

var PROGRESSBAR_HTML = '<div class="progress progress-striped active">'
    + '<div class="bar" style="width: 0%;"></div>'
    + '</div>';

function rmDir(fileSystem, dirName, callback) {
    fileSystem.root.getDirectory(dirName, {create: true},
        function(dir) { //success
           dir.removeRecursively(
                function() { callback(); },
                function(){ alert("Error deleting!"); }
            );
        },
        function() { alert("Error deleting directory"); } //fail
    );
}

function bulkDownload(urls, targetDir, progressModal, callback) {
  /*
   * Bulk download of urls to the targetDir (relative path from root) 
   */
  localStorageClear();
  window.requestFileSystem(
    LocalFileSystem.PERSISTENT, 0,
    function(fileSystem) { //success
        var rootDir = fileSystem.root.fullPath;
        if (rootDir[rootDir.length-1] != '/') { rootDir += '/'; }
        var dirPath = rootDir + targetDir;
        //show progress modal
        //DEBUG progressModal.modal('show');
        //add progress bar
        //DEBUG progressModal.find('.modal-body').append(PROGRESSBAR_HTML);
        var progressBar = progressModal.find(".bar");
        downloadFile(urls, 0, dirPath, progressModal, progressBar, callback);
    },
    function() { alert("Failure!"); } //filesystem failure
  );
}

function downloadFile(urls, index, dirPath, progressModal, progressBar, callback) {
    /*
     * Helper function for bulkDownload 
     */
    if (index >= urls.length) { //callback if done
        //clear and hide modal
        //DEBUG progressModal.find('.modal-body').html("");
        //DEBUG progressModal.modal('hide');
        callback();
        return;
    }

    //update modal progress
    progressBar.css('width', (index * 100.0 / urls.length) + '%');

    var url = urls[index];

    //NOTE: THIS IS SUPER HARD-CODED
    //all urls start with: http://api.tiles.mapbox.com/v3/ - length 31
    var tail = url.slice(31); //something like ex.map-1234saf/15/8580/12610.png

    var fn = dirPath + '/' + tail;

    var fileTransfer = new FileTransfer();
    fileTransfer.download(url, fn,
        function(theFile){
            setTimeout(function(){ downloadFile(urls, index+1, dirPath, progressModal, progressBar, callback); }, 300);
        },
        function(error) { alert("download error code: " + error.code); }
    );
}

return {
    'rmDir': rmDir,
    'bulkDownload': bulkDownload
};

}();