# Data Analysis
Tools to analyze or convert data dumps of weg-li and others.

## Plot
`plot.py` creates maps with datapoints from weg-li or wegeheld exports. You can specify a range of coordinates to keep
the computation time low. For example:
```bash
python3 plot.py -c 53.574148 53.581321 9.929722 9.950865 --wegeheld wegeheld_notices.csv
```

## Export
`export.py` is able to convert weg-li profiles, wegeheld notices or both into importable SQL files for the weg-li API.
For example:
```bash
python3 export.py -u -d wegli_profiles.csv wegeheld_notices.csv
```

The script creates two files:

`export.sql` contains the data and can be directly imported into a fresh database by running:
```bash
psql -h HOST -p PORT -d DBNAME -U USER -f export.sql
```

`user.json` contains the old user ID (key) and corresponding new user ID with its access token.
```json
{
  "1": {
    "access_token": "e390b50fa9090f177ffd7a7715654ac3b49cd1d2d7e44f26cecbf9772f32809c",
    "user_id": "665ef6d7-fa95-4057-a79f-1b7e51d18f05"
  },
  "2": {
    "access_token": "bfaacc897017a37d1c3f354afd82166a9aab9dfd62bd22d62924c29b45e37252",
    "user_id": "d2d41a24-cd43-4e09-83c8-da49d7b20bd1"
  }
}
```