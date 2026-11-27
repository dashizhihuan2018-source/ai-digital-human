#!/bin/bash
set -euo pipefail

package_dir="$(cd "$(dirname "$0")" && pwd -P)"
destination="${CODEX_HOME:-$HOME/.codex}/skills"
if [[ $# == 2 && "$1" == --dest ]]; then
    destination="$2"
elif [[ $# != 0 ]]; then
    printf '用法：%s [--dest 目标技能目录]\n' "$0" >&2
    exit 2
fi

skills=(
    digital-human-emotion-motion
    digital-human-emotion-joy
    digital-human-emotion-anger
    digital-human-emotion-sorrow
    digital-human-emotion-delight
)
pending=()
for name in "${skills[@]}"; do
    source="$package_dir/skills/$name"
    target="$destination/$name"
    if [[ ! -f "$source/SKILL.md" || -L "$source" ]]; then
        printf '安装包缺少 %s。请重新下载并解压整个安装包。\n' "$name" >&2
        exit 1
    fi
    if [[ -e "$target" || -L "$target" ]]; then
        if [[ -d "$target" && ! -L "$target" ]] && /usr/bin/diff -qr "$source" "$target" >/dev/null 2>&1; then
            continue
        fi
        printf '检测到已有其他版本，已保留：%s\n' "$target" >&2
        exit 1
    fi
    pending+=("$name")
done

if [[ ${#pending[@]} != 0 ]]; then
    mkdir -p "$destination"
    staging="$(mktemp -d "$destination/.emotion-install.XXXXXXXX")"
    installed=()
    cleanup() {
        local status=$?
        trap - EXIT
        if [[ $status != 0 ]]; then
            for name in "${installed[@]}"; do
                if /usr/bin/diff -qr "$package_dir/skills/$name" "$destination/$name" >/dev/null 2>&1; then
                    /bin/rm -rf -- "$destination/$name"
                fi
            done
        fi
        /bin/rm -rf -- "$staging"
        exit "$status"
    }
    trap cleanup EXIT
    for name in "${pending[@]}"; do
        /bin/cp -R "$package_dir/skills/$name" "$staging/$name"
    done
    for name in "${pending[@]}"; do
        /bin/mv -n "$staging/$name" "$destination/"
        if [[ -d "$staging/$name" ]]; then
            printf '安装期间出现同名技能，已保留：%s\n' "$destination/$name" >&2
            exit 1
        fi
        installed+=("$name")
    done
fi

printf '数字人情绪动作技能已就绪。\n'
printf '位置：%s\n' "$destination"
printf '在 Codex 中输入 $digital-human-emotion-motion 开始使用。\n'
