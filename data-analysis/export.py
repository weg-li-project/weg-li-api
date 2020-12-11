from argparse import ArgumentParser

from mapping import *
from uuid import uuid4
from plot import replace_types, read_wegeheld_csv, read_wegli_csv


def import_wegli(filename):
    wegli_notices = read_wegli_csv(filename)
    print(f"imported {len(wegli_notices)} weg-li data points")
    return replace_types(wegli_notices, wegli_mapping)


def import_wegeheld(filename):
    wegeheld_notices = read_wegeheld_csv(filename)
    print(f"imported {len(wegeheld_notices)} wegeheld data points")
    return replace_types(wegeheld_notices, wegeheld_mapping)


def generate_sql(notices):
    query = "INSERT INTO reports VALUES "
    for item in notices:
        uuid = str(uuid4())
        violation_type = charges.index(item[1])
        violation_time = item[0]
        latitude = item[2]
        longitude = item[3]
        query += f"\n('{uuid}', CURRENT_TIMESTAMP, NULL, {violation_type}, '{violation_time}', " \
                 f"ST_MakePoint({longitude}, {latitude}), NULL),"
    return query[:-1] + ";"


def main():
    parser = ArgumentParser(description="Generate SQL import file containing weg-li and/or wegeheld datasets")
    parser.add_argument("sql_file", help="output file")
    parser.add_argument("--wegeheld", help="wegeheld data file")
    parser.add_argument("--wegli", help="weg-li data file")
    args = parser.parse_args()

    data = []
    if args.wegeheld:
        data += import_wegeheld(args.wegeheld)

    if args.wegli:
        data += import_wegli(args.wegli)

    if len(data):
        query = generate_sql(data)
        with open(args.sql_file, "w") as f:
            f.write(query)
    else:
        print("couldn't import data")


if __name__ == "__main__":
    main()
