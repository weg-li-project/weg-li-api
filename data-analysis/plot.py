from matplotlib.patches import Patch
import matplotlib.pyplot as plt
from argparse import ArgumentParser
from datetime import timedelta
from time import strptime
import mplleaflet
import json
import csv

from mapping import *


'''
Formerly presented:
bergmannkiez = (52.481552, 52.502641, 13.373870, 13.436605)
gesundbrunnen = (52.54345, 52.56557, 13.34921, 13.41936)
hamburg = (53.574148, 53.581321, 9.929722, 9.950865)
horn = (53.541851, 53.560247, 10.067858, 10.116926)
schule_horn = (53.552117, 53.558099, 10.067226, 10.080170)
'''


def read_wegli_json(filename, data_filter=(-90, 90, -180, 180)):
    filtered_data = []
    with open(filename, "r") as f:
        data = json.load(f)["notices"]
        for item in data:
            if item["latitude"] and item["longitude"] \
                    and data_filter[0] <= float(item["latitude"]) <= data_filter[1] \
                    and data_filter[2] <= float(item["longitude"]) <= data_filter[3]:
                new = [item["date"][11:19], item["charge"], item["latitude"], item["longitude"]]
                filtered_data.append(new)
    return filtered_data


def read_wegli_csv(filename, data_filter=(-90, 90, -180, 180)):
    data = []
    with open(filename) as f:
        r = csv.reader(f, delimiter=",")
        next(r)
        for row in r:
            if len(row[5]) and len(row[6]) \
                    and data_filter[0] <= float(row[5]) <= data_filter[1] \
                    and data_filter[2] <= float(row[6]) <= data_filter[3]:
                new = [row[0][:19], row[1], float(row[5]), float(row[6])]
                data.append(new)
    return data


def read_wegeheld_csv(filename, data_filter=(-90, 90, -180, 180)):
    data = []
    with open(filename) as f:
        r = csv.reader(f, delimiter=",")
        next(r)
        for row in r:
            if len(row[0]) and len(row[1]) \
                    and data_filter[0] <= float(row[0]) <= data_filter[1] \
                    and data_filter[2] <= float(row[1]) <= data_filter[3]:
                new = [row[3] + " 00:00:00", int(row[4]), float(row[0]), float(row[1])]
                data.append(new)
    return data


def plot(data, color_map):
    counter = 0
    plt.rc("xtick", labelsize=18)
    plt.rc("ytick", labelsize=18)
    plt.rc("axes", labelpad=25, labelsize=18)

    fig1 = plt.figure(figsize=(20, 20))
    ax1 = fig1.add_subplot(111)
    ax1.set_xlabel("Longitude")
    ax1.set_ylabel("Time (seconds from midnight)")

    fig2 = plt.figure(figsize=(20, 20))
    ax2 = fig2.add_subplot(111)
    ax2.set_xlabel("Latitude")
    ax2.set_ylabel("Time (seconds from midnight)")

    fig3 = plt.figure(figsize=(20, 20))
    ax3 = fig3.add_subplot(111, projection="3d")
    ax3.set_xlabel("Longitude")
    ax3.set_ylabel("Latitude")
    ax3.set_zlabel("Time (seconds from midnight)")

    for item in data:
        t = strptime(item[0][11:], "%H:%M:%S")
        longitude = item[2]
        latitude = item[3]
        seconds = timedelta(hours=t.tm_hour, minutes=t.tm_min, seconds=t.tm_sec).total_seconds()
        try:
            ax1.scatter(longitude, seconds, c=[color_map[item[1]]])
            ax2.scatter(latitude, seconds, c=[color_map[item[1]]])
            ax3.scatter(longitude, latitude, seconds, c=[color_map[item[1]]])
        except KeyError:
            counter += 1

    if counter:
        print("could not find a color for " + str(counter) + " data points")
    fig1.savefig("long_time.png", bbox_inches="tight")
    fig2.savefig("lat_time.png", bbox_inches="tight")
    fig3.savefig("long_lat_time.png", bbox_inches="tight")


def show_map(data, color_map):
    counter = 0
    for item in data:
        try:
            plt.plot(item[3], item[2], "s", color=color_map[item[1]])
        except KeyError:
            counter += 1
    if counter:
        print("could not find a color for " + str(counter) + " data points")
    mplleaflet.show()


def export_legend(filename, color_map):
    fig = plt.figure(figsize=(20, 20))
    violations = []
    labels = []
    for item in color_map:
        violations.append(Patch(color=color_map[item], label=item))
        labels.append(item)
    fig.legend(handles=violations, labels=labels)
    plt.savefig(filename, bbox_inches="tight", dpi=100)


def find_replacement(mapping, item):
    for key in mapping:
        if item in mapping[key]:
            return key


def replace_types(data, mapping):
    lst = []
    counter = 0
    for i in range(len(data)):
        if not data[i][1] in charges:
            rep = find_replacement(mapping, data[i][1])
            if rep:
                data[i][1] = rep
                lst.append(data[i])
            else:
                counter += 1
        else:
            lst.append(data[i])
    if counter:
        print("could not find a replacement for " + str(counter) + " data points")
    return lst


def main():
    parser = ArgumentParser(description="Generate map and plots based on weg-li or wegeheld data")
    parser.add_argument("file", help="input")
    parser.add_argument("-c", "--coordinates", nargs=4, type=float, help="coordinate filter")
    parser.add_argument("--wegeheld", action="store_true", help="wegeheld data file")
    parser.add_argument("--wegli", action="store_true", help="weg-li data file")
    parser.add_argument("-l", "--legend", action="store_true", help="export legend")
    args = parser.parse_args()

    if args.coordinates:
        rect_filter = tuple(args.coordinates)
    else:
        rect_filter = (-90, 90, -180, 180)

    if args.legend:
        export_legend("legend.png", colormap)

    if args.wegeheld:
        data = read_wegeheld_csv(args.file, rect_filter)
        data = replace_types(data, wegeheld_mapping)
    elif args.wegli:
        if ".csv" in args.file:
            data = read_wegli_csv(args.file, rect_filter)
        else:
            data = read_wegli_json(args.file, rect_filter)
        data = replace_types(data, wegli_mapping)
    else:
        print("Please set wegeheld or weg-li flag")
        parser.print_help()
        return

    print(f"imported {len(data)} data points")

    show_map(data, colormap)
    plot(data, colormap)


if __name__ == "__main__":
    main()
