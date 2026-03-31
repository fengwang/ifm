#!/bin/sh
set -e

align_ifm_root_owner() {
	IFM_RUNTIME_ROOT="${IFM_ROOT_DIR:-/var/www}"

	case "$IFM_RUNTIME_ROOT" in
		/*) ;;
		*) IFM_RUNTIME_ROOT="/usr/local/share/webapps/ifm/$IFM_RUNTIME_ROOT" ;;
	esac

	if [ -d "$IFM_RUNTIME_ROOT" ]; then
		chown -R "$(id -u www-data):$(id -g www-data)" "$IFM_RUNTIME_ROOT"
	fi
}

if [ -n "$IFM_DOCKER_UID" ]; then
	# check if UID/GID are numeric
	if ! echo "$IFM_DOCKER_UID$IFM_DOCKER_GID" | grep -E "^[0-9]+$" >/dev/null 2>&1; then
		echo "FATAL: IFM_DOCKER_UID or IFM_DOCKER_GID are not numeric (UID: $IFM_DOCKER_UID, GID: $IFM_DOCKER_GID)"
		exit 1
	fi

	# get GID if not set
	if [ -z "$IFM_DOCKER_GID" ]; then
		export IFM_DOCKER_GID="$IFM_DOCKER_UID"
	fi

	# delete user if already exists
	if getent passwd "$IFM_DOCKER_UID" >/dev/null 2>&1; then
		deluser $(getent passwd "$IFM_DOCKER_UID" | sed "s/:.*//")
	fi

	# check if group already exists
	if ! getent group "$IFM_DOCKER_GID" >/dev/null 2>&1; then
		addgroup -g "$IFM_DOCKER_GID" -S www-data
		REAL_GROUP=www-data
	else
		REAL_GROUP=$(getent group "$IFM_DOCKER_GID" | sed "s/:.*//")
	fi

	adduser -u "$IFM_DOCKER_UID" -SHDG "$REAL_GROUP" www-data
else
	addgroup -g 33 -S www-data
	adduser -SHD -u 33 -G www-data www-data
fi

align_ifm_root_owner

exec sudo -Eu www-data /usr/local/bin/php -c /usr/local/share/webapps/ifm/php.ini -S 0:80 -t /usr/local/share/webapps/ifm
