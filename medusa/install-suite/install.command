#!/bin/bash
set -euo pipefail

package_dir="$(cd "$(dirname "$0")" && pwd -P)"
destination="${CODEX_HOME:-$HOME/.codex}/skills"
if [[ $# == 2 && "$1" == --dest && -n "$2" ]]; then
    destination="$2"
elif [[ $# != 0 ]]; then
    printf '用法：%s [--dest 目标技能目录]\n' "$0" >&2
    exit 2
fi

main=ai-digital-human-modeling
source="$package_dir/skills/$main"
subskills=(digital-human-appearance digital-human-rigging digital-human-emotion-motion private-assistant-character digital-human-delivery)
legacy=(digital-human-emotion-joy digital-human-emotion-anger digital-human-emotion-sorrow digital-human-emotion-delight)
if [[ ! -f "$source/SKILL.md" ]]; then
    printf '安装包缺少主技能，请重新下载并解压整个 ZIP。\n' >&2
    exit 1
fi
for name in "${subskills[@]}"; do
    if [[ ! -f "$source/subskills/$name/SKILL.md" ]]; then
        printf '安装包缺少 %s，请重新下载并解压整个 ZIP。\n' "$name" >&2
        exit 1
    fi
done

matches_legacy() {
    local name="$1" folder="$destination/$1" manifest="$package_dir/legacy/$1.sha256"
    [[ -d "$folder" && ! -L "$folder" && -f "$manifest" ]] || return 1
    [[ -z "$(/usr/bin/find "$folder" -type l -print -quit)" ]] || return 1
    (
        cd "$folder"
        /usr/bin/find . -type f ! -name .DS_Store -print | LC_ALL=C /usr/bin/sort |
            while IFS= read -r file; do /usr/bin/shasum -a 256 "$file"; done
    ) | /usr/bin/diff -q "$manifest" - >/dev/null
}

conflict() {
    printf '检测到自定义或其他版本，已保留：%s\n' "$1" >&2
    printf '可用 bash install.command --dest <独立技能目录> 安装公开版。\n' >&2
    exit 1
}

mkdir -p "$destination"
destination="$(cd "$destination" && pwd -P)"
lock="$destination/.digital-human-suite-install"
if ! mkdir "$lock" 2>/dev/null; then
    printf '目标目录已有安装任务或临时目录：%s\n' "$lock" >&2
    exit 1
fi

backup=""
moved=()
activated=0
cleanup() {
    local status=$?
    trap - EXIT
    if [[ "$status" != 0 && "$activated" = 0 && ${#moved[@]} -gt 0 ]]; then
        for name in "${moved[@]}"; do
            if [[ ! -e "$destination/$name" && ! -L "$destination/$name" ]]; then
                /bin/mv -n "$backup/$name" "$destination/"
            fi
        done
        printf '旧版备份位置：%s\n' "$backup" >&2
    fi
    /bin/rm -rf -- "$lock"
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

target="$destination/$main"
already_installed=0
pending=()
if [[ -e "$target" || -L "$target" ]]; then
    if [[ -d "$target" && ! -L "$target" ]] && /usr/bin/diff -qr -x .DS_Store "$source" "$target" >/dev/null 2>&1; then
        already_installed=1
    elif matches_legacy "$main"; then
        pending+=("$main")
    else
        conflict "$target"
    fi
fi

for name in "${subskills[@]}" "${legacy[@]}"; do
    if [[ -e "$destination/$name" || -L "$destination/$name" ]]; then
        matches_legacy "$name" || conflict "$destination/$name"
        pending+=("$name")
    fi
done

if [[ "$already_installed" = 0 ]]; then
    /bin/cp -R "$source" "$lock/$main"
fi
if [[ ${#pending[@]} -gt 0 ]]; then
    backup="$(mktemp -d "$destination/../digital-human-suite-backup.XXXXXXXX")"
    for name in "${pending[@]}"; do
        matches_legacy "$name" || conflict "$destination/$name"
        /bin/mv "$destination/$name" "$backup/"
        moved+=("$name")
    done
fi
if [[ "$already_installed" = 0 ]]; then
    /bin/mv -n "$lock/$main" "$destination/"
    if [[ -d "$lock/$main" ]]; then
        conflict "$target"
    fi
fi
activated=1
if [[ -n "$backup" ]]; then printf '已备份旧公开技能到 %s\n' "$backup"; fi
printf '数字人技能套装已安装，包含 1 个主技能和 5 个分技能。\n'
printf '位置：%s\n在 Codex 中输入 $ai-digital-human-modeling。\n' "$target"
