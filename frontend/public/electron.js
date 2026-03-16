const { app, BrowserWindow } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  const indexPath = path.join(__dirname, "build", "index.html");

  // Convert path to proper file URL (fixes spaces in path)
  const fileUrl = pathToFileURL(indexPath).href;

  win.loadURL(fileUrl);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});