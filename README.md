# How to install Bleeding Edge releases?
This largely depends on browser, with individual steps down below.

**Note: Firefox only has the option to add temporary add-ons, so you'd have to re-add `Dungeon Extension` every time you close and reopen Firefox.**

## Chrome
1. Download and unpack one of the releases from the side-bar.
2. Navigate to the search bar.
3. Search for `chrome://extensions/`.
4. Click on `Load unpacked`.
5. Navigate to the unpacked folder where you placed the contents.
6. Select the folder in which `manifest.json` is located.
7. Click on `Select Folder`.
8. Done.

## Firefox
1. Download and unpack one of the releases from the side-bar.
2. Navigate to the search bar.
3. Search for `about:debugging`.
4. Click on `This Firefox`.
5. Click on `Load Temporary Add-on...`
5. Navigate to the unpacked folder where you placed the contents.
6. Select the folder in which `manifest.json` is located.
7. Click on `manifest.json`.
8. Click on `Open`.
9. Done.

# What do the Settings do?
Each settings is further explained below.

## Characters
- **`Portrait`**: The icon you want to display when their name is mentioned.
- **`Name`**: The main name of the character, used to trigger the highlighting.
- **`Nicknames`**: Additional triggers you can add, such as in the case of Claudia: `Clauds,Claud` or whatever.
- **`Color`**: The color which is used when the `Color Mode` is set to `Special`.
- **`Color Mode`**: The main mode which is used to paint characters, there is a `Shared` mode which means that it'll use the global color in the `Settings` panel otherwise.

## Settings
- **`Adventure ID`**: This is the current ID which is used to store all your data such as character icons and notes *__for that specific adventure__*.
- **`Plugin Version`**: Pretty self-explanatory.

**General:**
- **`Enable Auto-Save`**: If this is on then the plugin will try to save any changes you made automatically, without having to click on a save button.
- **`Enable Auto-Resize`**: If this is on then all images/portraits you import will be downscaled to `64x64` pixels automatically. Which saves on file size.

**Character Settings:**
- **`Color (Default)`**: The default color which is used every time you add a new character.
- **`Color (Shared)`**: The color which all characters use if their `Color Mode` is set to `Shared`.
- **`Portrait Size (px)`**: The size of all the character icons/portraits in pixels.
- **`Border Radius`**: The border radius of all character icons/portraits, if this is set to 50 then they become very rounded.

**Note Settings:**
- **`Notes Per Page`**: The amount of notes which are render per note page. This is not Obsidian, please don't make 100+ notes.
- **`Default Color`**: The default label color for when you enter the `Notes` panel.