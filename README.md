# EmailAdvocacy

## Run the code

start a webserver

`python3 -m http.server 8000`

connect to it at `localhost:8000`

## Testing

I have been using the Microsoft "live server preview" extension for testing

beware of open sates api limits

- 250 requests per day
- 10 requests per minute

## Api keys

Getting your own api keys

- Google: <https://developers.google.com/civic-information/docs/using_api>
- Openstates: <https://openstates.org/api/register/>

once you have them create a file called `env.json`:

```json
{
  "OPENSTATES_API_KEY": "xxxxxxxxxx",
  "GOOGLE_CIVIC_API_KEY": "xxxxxxxxxxxxxx"
}
```

don't commit this file to github

## Deploy the Wix demo with Netlify

The production demo uses a Netlify Function so API keys are never sent to the browser.

1. Import this GitHub repository into Netlify and choose the `50-states-testing` branch.
2. Leave the build command blank. Netlify reads the settings from `netlify.toml`.
3. Under **Project configuration → Environment variables**, add
   `GOOGLE_CIVIC_API_KEY` and `OPENSTATES_API_KEY` with the **Functions** scope.
4. Trigger a new production deploy.
5. Test the generated `netlify.app` URL.
6. In Wix, add **Embed Code → Embed a Site**, paste the Netlify URL, and resize
   the element to about 700px wide by 500px high.
