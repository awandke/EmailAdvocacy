# EmailAdvocacy

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

## State Info 

Alabama 

Alaska

Arizona

- One District, Two Chambers System
- 30 Senate Districts
- 60 Representatives, 2 per district

Arkansas

California

- Nested 2:1 District System
- 80 assembly distircts
- 40 senate districts

Colorado

- Districts Drawn Separately
- 65 House Districts
- 35 Senate Districts

Connecticut

- [General Assembly](https://www.cga.ct.gov/default.asp)
- Districts Drawn Separately
- 151 House districts
- 36 Senate districts

Delaware

- [General Assembly](https://legis.delaware.gov/)
- Districts Drawn Separately
- 41 House Districts
- 21 Senate Districts

Florida 

- [House of Representatives](https://www.flhouse.gov/default.aspx)
- [Florida Senate](https://www.flsenate.gov/)
- 120 House Districts
- 40 Senate Districts

Geogia

- [General Assembly](https://www.legis.ga.gov/)
- Districts Drawn Separately
- 180 House Districts
- 56 Senate Districts