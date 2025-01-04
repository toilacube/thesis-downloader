import json

# Function to modify the URL, adding the placeholder for the counter
def modify_url(url):
    # Replace the original URL with the modified one, using {counter} as a placeholder
    return f"{url}&page={{counter}}"

# Read the JSON file
def update_urls_in_json(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Modify the URLs
    for obj in data:
        if 'url' in obj:
            obj['url'] = modify_url(obj['url'])

    # Write the updated data to a new JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)  # Ensure non-ASCII characters are not escaped

# Example usage
input_file = 'data.json'  # Input JSON file
output_file = 'output.json'  # Output JSON file

update_urls_in_json(input_file, output_file)
