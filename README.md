# EmailAdvocacy

## Run the code 

start a webserver 

`EmailAdvocacy$ python3 -m http.server 8000`

connect to it at `localhost:8000`

## Testing 

I have been using the Microsoft "live server preview" exetentions for testing

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

