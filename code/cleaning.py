import argparse
from pathlib import Path
import random
import csv


def generate_dataset(num_rows: int, seed: int) -> list[dict]:
    random.seed(seed)

    rows = []
    genders = ["Female", "Male", "Non-binary"]
    gender_effect = {"Female": 0.4, "Male": 0.2, "Non-binary": 0.3}

    for person_id in range(1, num_rows + 1):
        age = random.randint(13, 75)
        gender = random.choice(genders)

        # Baseline viewing profile shaped by age, with mild gender effect and random noise.
        age_effect = max(0, (40 - abs(age - 30)) / 25)
        noise = random.uniform(-1.2, 1.2)
        watch_hours_per_week = max(0.2, round(3 + age_effect + gender_effect[gender] + noise, 2))

        rows.append(
            {
                "person_id": person_id,
                "age": age,
                "gender": gender,
                "netflix_hours_per_week": watch_hours_per_week,
            }
        )

    return rows


def save_dataset(rows: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["person_id", "age", "gender", "netflix_hours_per_week"]
        )
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a random Netflix viewing dataset by age and gender."
    )
    parser.add_argument("--rows", type=int, default=200, help="Number of rows to generate.")
    parser.add_argument(
        "--seed", type=int, default=30, help="Random seed for reproducible output."
    )
    parser.add_argument(
        "--output",
        type=str,
        default="code/netflix_watch_data.csv",
        help="Output CSV path.",
    )
    args = parser.parse_args()

    dataset = generate_dataset(num_rows=args.rows, seed=args.seed)
    save_dataset(dataset, Path(args.output))

    print(f"Generated {len(dataset)} rows.")
    print(f"Saved dataset to: {args.output}")
    print("Preview (first 5 rows):")
    for row in dataset[:5]:
        print(row)


if __name__ == "__main__":
    main()
