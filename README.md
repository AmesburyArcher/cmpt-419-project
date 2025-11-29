# Instructions To Run App

## Clone The Repo
This app has not been deployed, so you must clone the repo and run it locally.

## Configure .env File:

In order for the app to work, a .env file needs to be added to root level of the repo /cmpt-419-project.
In this file, this line needs to be added.
```
VITE_SPORTS_ODDS_API_KEY = <API_KEY_GOES_HERE>
```
Once this is added, the app will be able to function.

## Running the Application

To run the app locally, the easiest way it to utilize development mode by running the command
in the terminal
```
npm run dev
```
The app should then be running on http://localhost:5173/. If it is not running on this port number,
inspect the console as Vite dev should report which URL to access the app from.