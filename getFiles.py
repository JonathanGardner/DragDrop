import os

EXCLUDE_DIRS = {'ui'}
EXCLUDE_FILES = {'layout.tsx', 'globals.tsx', 'globals.css'}

def is_excluded_dir(dirname):
    return dirname in EXCLUDE_DIRS

def is_excluded_file(filename):
    return filename in EXCLUDE_FILES

def build_tree(root_dir):
    tree = {}
    for root, dirs, files in os.walk(root_dir):
        # Exclude specified directories
        dirs[:] = [d for d in dirs if not is_excluded_dir(d)]
        rel_path = os.path.relpath(root, root_dir)
        if rel_path == '.':
            rel_path = ''  # Replace '.' with empty string for root
        tree[rel_path] = {'dirs': [], 'files': []}

        for d in dirs:
            tree[rel_path]['dirs'].append(d)
        for f in files:
            if not is_excluded_file(f):
                tree[rel_path]['files'].append(f)
    return tree

def print_tree(tree, root_dir_name):
    def walk(path, prefix=''):
        entries = tree.get(path, {'dirs': [], 'files': []})
        # Sort directories and files separately for consistent ordering
        dirs_sorted = sorted(entries['dirs'])
        files_sorted = sorted(entries['files'])
        all_entries = dirs_sorted + files_sorted
        for idx, name in enumerate(all_entries):
            is_last = idx == len(all_entries) - 1
            connector = '└── ' if is_last else '├── '
            if path:
                full_path = os.path.join(path, name)
            else:
                full_path = name
            if name in entries['dirs']:
                print(f"{prefix}{connector}{name}/")
                extension = '    ' if is_last else '│   '
                walk(full_path, prefix + extension)
            else:
                print(f"{prefix}{connector}{name}")
    print(f"{root_dir_name}/")
    walk('')

def get_tsx_files(tree, root_dir):
    tsx_files = []
    for path, entries in tree.items():
        for f in entries['files']:
            if f.endswith('.tsx'):
                if path:
                    # Use forward slashes for consistency in output
                    tsx_files.append(os.path.join(root_dir, path, f).replace(os.sep, '/'))
                else:
                    tsx_files.append(os.path.join(root_dir, f).replace(os.sep, '/'))
    return tsx_files

def main():
    root_dirs = ['app', 'components', 'data', 'hooks','types']
    all_tsx_files = []

    # Build and print the tree
    for root_dir in root_dirs:
        if os.path.exists(root_dir):
            tree = build_tree(root_dir)
            print_tree(tree, root_dir)
            tsx_files = get_tsx_files(tree, root_dir)
            all_tsx_files.extend(tsx_files)
        else:
            print(f"Directory '{root_dir}' does not exist.")

    # Print the files and their code
    print("\nFiles:")
    for f in all_tsx_files:
        print(f)
        try:
            with open(f, 'r', encoding='utf-8') as file:
                code = file.read()
                print(code)
        except Exception as e:
            print(f"Error reading file {f}: {e}")
        print("\n" + "-"*80 + "\n")  # Separator between files

    print("""
          
Understand all the code.
After you understand the code response with "UNDERSTOOD"
When ever I ask you to code something. You respond with the full code.
Also to clarify, when I say show full code, only show the full code to the files that were updated.
          """)

if __name__ == '__main__':
    main()
