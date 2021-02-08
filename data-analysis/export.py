from argparse import ArgumentParser
from secrets import token_hex
from hashlib import sha256
from mapping import *
from uuid import uuid4
from time import time
from json import dumps
import csv


def find_replacement(mapping, item):
    for key in mapping:
        if item in mapping[key]:
            return key


def replace_types(data, mapping):
    lst = []
    counter = 0
    for i in range(len(data)):
        if not data[i]["charge"] in charges:
            rep = find_replacement(mapping, data[i]["charge"])
            if rep:
                data[i]["charge"] = rep
                lst.append(data[i])
            else:
                counter += 1
        else:
            lst.append(data[i])
    if counter:
        print("could not find a replacement for " + str(counter) + " data points")
    return lst


def read_csv(filename):
    with open(filename, "r") as csv_file:
        data = list(csv.reader(csv_file))
        out = []
        for item in data[1:]:
            new = dict(zip(data[0], item))
            new["date"] = new["date"]
            try:
                new["longitude"] = float(new["longitude"])
                new["latitude"] = float(new["latitude"])
                try:
                    new["charge"] = int(new.pop("charge_id"))
                except KeyError:
                    pass
                try:
                    if new["severity"] == "standard":
                        new["severity"] = 0
                    elif new["severity"] == "hinder":
                        new["severity"] = 1
                    elif new["severity"] == "endanger":
                        new["severity"] = 2
                    else:
                        new["severity"] = -1
                except KeyError:
                    new["severity"] = -1
                out.append(new)
            except ValueError:
                pass
        return out


def import_data(filename):
    notices = read_csv(filename)
    print(f"imported {len(notices)} data points")

    # check if wegli or wegeheld data
    try:
        notices[0]['carbrand']
        replaced = replace_types(notices, wegeheld_mapping)
    except KeyError:
        replaced = replace_types(notices, wegli_mapping)

    cleaned = remove_duplicates(replaced)
    print(f"removed {len(replaced) - len(cleaned)} duplicates")
    return cleaned


def remove_duplicates(lst):
    allowed = ["charge", "user_id", "longitude", "latitude", "date", "severity"]

    def is_allowed(item):
        return item[0] in allowed

    return list(map(dict, frozenset(frozenset(filter(is_allowed, i.items())) for i in lst)))


def get_uuid(uuids, name):
    if name not in uuids:
        uuids[name] = uuid4()
    return uuids[name]


def generate_token():
    token = token_hex(32)
    hash = sha256(token.encode()).hexdigest()
    return token, hash


def generate_auth_sql(uuids):
    user_list = {}
    users_query = "INSERT INTO users VALUES "
    user_access_query = "INSERT INTO user_access VALUES "
    for old_id in uuids:
        id = int(old_id)
        token, hash = generate_token()
        user_list[id] = {}
        user_list[id]["user_id"] = str(uuids[old_id])
        user_list[id]["access_token"] = token
        users_query += f"\n('{uuids[old_id]}', TO_TIMESTAMP({int(time())})),"
        user_access_query += f"\n('{uuids[old_id]}', '{hash}'),"
    return user_list, users_query, user_access_query


def generate_report_sql(notices):
    uuids = {}
    query = "INSERT INTO reports VALUES "
    for item in notices:
        try:
            user_id = str(get_uuid(uuids, str(item["user_id"])))
        except KeyError:
            user_id = ""
        uuid = str(uuid4())
        violation_type = charges.index(item["charge"])
        violation_time = item["date"]
        latitude = item["latitude"]
        longitude = item["longitude"]
        severity = item["severity"]
        query += f"\n('{uuid}', CURRENT_TIMESTAMP, '{user_id}', {violation_type}, '{severity}', '{violation_time}', " \
                 f"ST_MakePoint({longitude}, {latitude}), NULL),"
    return query[:-1] + ";", uuids


def main():
    parser = ArgumentParser(description="Generate SQL import file containing weg-li and/or wegeheld datasets")
    parser.add_argument("-d", "--data", nargs="+", help="data files", required=True)
    parser.add_argument("-u", "--users", help="enables export of user data", action="store_true")
    args = parser.parse_args()

    data = []
    for file in args.data:
        data += import_data(file)

    if len(data):
        query, uuids = generate_report_sql(data)
        if args.users:
            user_list, users_query, user_access_query = generate_auth_sql(uuids)
            with open("export.sql", "w") as f:
                f.write(query[:-1] + ";\n" + users_query[:-1] + ";\n" + user_access_query[:-1] + ";")
            with open("users.json", "w") as f:
                f.write(dumps(user_list, sort_keys=True, indent=4))
        else:
            with open("export.sql", "w") as f:
                f.write(query)
    else:
        print("couldn't import/export data")


if __name__ == "__main__":
    main()
