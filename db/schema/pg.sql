-- XUI tables

-- temp solution for SQLite compatable last_insert_rowid()
CREATE OR REPLACE FUNCTION LAST_INSERT_ROWID() RETURNS INTEGER AS
$$
DECLARE
	insert_id INTEGER;

BEGIN
        SELECT INTO insert_id lastval();
        return insert_id;
END;
$$
LANGUAGE plpgsql;


CREATE TABLE routes (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	description VARCHAR,
	prefix VARCHAR NOT NULL DEFAULT '',
	max_length INTEGER NOT NULL DEFAULT 12,
	context VARCHAR,
	dnc VARCHAR,
	sdnc VARCHAR,
	dest_type VARCHAR,
	dest_uuid VARCHAR,
	body TEXT,
	auto_record INTEGER DEFAULT 0,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX routes_deleted_at ON routes(deleted_at);

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	extn VARCHAR,
	name VARCHAR NOT NULL,
	cid_number VARCHAR,
	cid_name VARCHAR,
	context VARCHAR,
	domain VARCHAR DEFAULT 'xswitch.cn',
	password VARCHAR,
	vm_password VARCHAR,
	user_cidr VARCHAR,
	login VARCHAR,
	email VARCHAR,
	type VARCHAR,
	tel VARCHAR,
	auto_record INTEGER DEFAULT 0,
	disabled INTEGER DEFAULT 0,
	weblogin_disabled INTEGER NOT NULL DEFAULT 0,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX users_extn ON users(domain, extn);
CREATE INDEX users_deleted_at ON users(deleted_at);

CREATE TABLE user_dev_key (
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	key VARCHAR,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);


CREATE UNIQUE INDEX user_dev_key_index ON user_dev_key(key);
CREATE UNIQUE INDEX user_dev_key_user_id ON user_dev_key(user_id);

CREATE TABLE blocks (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	description VARCHAR,
	ver TEXT,
	xml TEXT,
	js TEXT,
	lua TEXT,
	ivr_menu_id VARCHAR,  -- link to a IVR block

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX blocks_deleted_at ON blocks(deleted_at);

CREATE TABLE dicts (
	id SERIAL PRIMARY KEY,
	realm VARCHAR NOT NULL,
	k VARCHAR NOT NULL, -- key
	v VARCHAR, -- value
	d VARCHAR, -- description
	o INTEGER, -- order
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX dicts_realm ON dicts(realm);
CREATE INDEX dicts_k ON dicts(k);
CREATE UNIQUE INDEX dicts_realm_k ON dicts(realm, k);

CREATE TABLE groups (
	id SERIAL PRIMARY KEY,
	sort INTEGER,
	realm VARCHAR NOT NULL,           -- a key in dicts
	name VARCHAR NOT NULL,
	level integer DEFAULT 0,
	description VARCHAR,
	group_id INTEGER,        -- nested groups
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX groups_deleted_at ON groups(deleted_at);

CREATE TABLE user_groups (
	id SERIAL PRIMARY KEY,
	sort INTEGER,
	user_id SERIAL NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	group_id SERIAL NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX user_group_u_g_id ON user_groups(user_id, group_id);

CREATE TABLE extn_groups (
	id SERIAL PRIMARY KEY,
	user_id SERIAL NOT NULL,
	group_id SERIAL NOT NULL,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX extn_group_e_g_id ON extn_groups(user_id, group_id);

CREATE TABLE gateways (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	realm VARCHAR NOT NULL,
	username VARCHAR,
	password VARCHAR,
	register VARCHAR NOT NULL DEFAULT 'true',
	profile_id INTEGER,
	description VARCHAR,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX gateways_name ON gateways(name);
CREATE INDEX gateways_deleted_at ON gateways(deleted_at);

CREATE TABLE params (
	id SERIAL PRIMARY KEY,
	realm VARCHAR NOT NULL, -- e.g. sip_profiles or gateways
	k VARCHAR NOT NULL,
	v VARCHAR,
	ref_id INTEGER, -- e.g. sip_profiles.id or gateway.id
	disabled INTEGER DEFAULT 0,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX params_realm ON params(realm);
CREATE INDEX params_rrk ON params(realm, ref_id, k);
CREATE INDEX params_deleted_at ON params(deleted_at);

CREATE TABLE sip_profiles (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	description VARCHAR,
	disabled INTEGER DEFAULT 0,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX sip_profiles_name ON sip_profiles(name);
CREATE INDEX sip_profiles_deleted_at ON sip_profiles(deleted_at);

CREATE TABLE media_files (
	id SERIAL PRIMARY KEY,
	type VARCHAR,          -- FAX, PDF, AUDIO, VIDEO, AUDIO_CONF, VIDEO_CONF
	name VARCHAR NOT NULL,
	description VARCHAR,
	file_name VARCHAR,
	ext VARCHAR,
	mime VARCHAR,
	file_size INTEGER,
	channels INTEGER,
	sample_rate INTEGER,
	bit_rate INTEGER,
	duration INTEGER,
	original_file_name VARCHAR,
	dir_path VARCHAR, -- dir
	abs_path VARCHAR, -- absolute path
	rel_path VARCHAR, -- relative path
	thumb_path VARCHAR,
	meta TEXT,
	geo_position VARCHAR,
	user_id INTEGER,
	channel_uuid VARCHAR,
	processing_flag INTEGER DEFAULT 0, -- 0 - unprocessed, 1 - processed, 2 - whatever

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX media_files_created_at ON media_files(created_at);
CREATE INDEX media_files_type ON media_files(type);

CREATE TABLE conference_rooms (
	id SERIAL PRIMARY KEY,
	name VARCHAR,
	description VARCHAR,
	nbr VARCHAR,  -- conference number
	capacity INTEGER DEFAULT 0,
	realm VARCHAR,
	fps VARCHAR,
	bandwidth VARCHAR,
	pin VARCHAR,
	profile_id INTEGER,
	moderator VARCHAR,
	canvas_count INTEGER,
	video_mode VARCHAR,
	call_perm VARCHAR,
	cluster JSONB,
	banner JSONB,
	user_id INTEGER,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE conference_members (
	id SERIAL PRIMARY KEY,
	room_id SERIAL NOT NULL,
	name VARCHAR,
	description VARCHAR,
	num VARCHAR,  -- conference number
	route VARCHAR,
	sort INTEGER,
	group_id INTEGER,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE devices (
	id SERIAL PRIMARY KEY,
	name VARCHAR,
	type VARCHAR,
	vendor VARCHAR,
	mac VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE user_devices (
	id SERIAL PRIMARY KEY,
	user_id SERIAL NOT NULL,
	device_id VARCHAR NOT NULL,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE fifo_cdrs (
	id SERIAL PRIMARY KEY,
	channel_uuid VARCHAR NOT NULL,
	fifo_name VARCHAR NOT NULL,
	ani VARCHAR,                -- the original caller id number
	dest_number VARCHAR,        -- the original dest number
	bridged_number VARCHAR,     -- bridged_number
	media_file_id INTEGER,

	started_at TIMESTAMP(0) DEFAULT NOW(),
	bridged_at TIMESTAMP(0),
	ended_at TIMESTAMP(0)
);

CREATE INDEX fifo_cdrs_started_at ON fifo_cdrs(started_at);
CREATE INDEX fifo_cdrs_channel_uuid ON fifo_cdrs(channel_uuid);

CREATE TABLE fifos (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	description VARCHAR,
	importance INTEGER DEFAULT 0,
	outbound_per_cycle INTEGER DEFAULT 1,
	outbound_per_cycle_min INTEGER DEFAULT 1,
	outbound_name VARCHAR,
	outbound_strategy VARCHAR DEFAULT 'ringall',
	outbound_priority INTEGER DEFAULT 5,
	retry_delay INTEGER DEFAULT 0,
	auto_record INTEGER DEFAULT 0,
	record_template VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX fifo_name ON fifos(name);

CREATE TABLE fifo_members (
	id SERIAL PRIMARY KEY,
	fifo_id INTEGER,
	name VARCHAR,
	description VARCHAR,
	fifo_name VARCHAR,
	timeout INTEGER DEFAULT 60,
	simo INTEGER DEFAULT 1,
	lag INTEGER DEFAULT 2,
	wait VARCHAR DEFAULT 'nowait',
	extn VARCHAR,
	dial_string VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX fifo_member_fifo_name ON fifo_members(fifo_name);

CREATE TABLE mcasts (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	source VARCHAR,
	codec_name VARCHAR,
	codec_ms INTEGER,
	channels VARCHAR DEFAULT '1',
	mcast_ip VARCHAR,
	mcast_port VARCHAR,
	sample_rate VARCHAR,
	enable INTEGER DEFAULT 0,
	auto_mode INTEGER DEFAULT 0,
	-- todo
	-- auto_start_time INTEGER DEFAULT (STRFTIME('%H:%M', 'now', 'localtime')),
	-- auto_stop_time INTEGER DEFAULT (STRFTIME('%H:%M', 'now', 'localtime')),

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX mcasts_name ON mcasts(name);
CREATE UNIQUE INDEX mcasts_maddress_mport ON mcasts(mcast_ip, mcast_port);

CREATE INDEX mcasts_deleted_at ON mcasts(deleted_at);

CREATE TABLE mfile_mcasts (
	id SERIAL PRIMARY KEY,
	mfile_id SERIAL NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
	mcast_id SERIAL NOT NULL REFERENCES mcasts(id) ON DELETE CASCADE,
	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX mfile_mcast_m_m_id ON mfile_mcasts(mfile_id, mcast_id);

CREATE TABLE permissions (
	id SERIAL PRIMARY KEY,
	action VARCHAR,
	method VARCHAR,
	param VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE group_permissions (
	id SERIAL PRIMARY KEY,
	group_id INTEGER,
	permission_id INTEGER,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);


CREATE TABLE conference_profiles (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	description VARCHAR,
	disabled INTEGER DEFAULT 0,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX conference_profiles_name ON conference_profiles(name);
CREATE INDEX conference_profiles_deleted_at ON conference_profiles(deleted_at);

CREATE TABLE ivr_menus (
	id SERIAL PRIMARY KEY,
	name VARCHAR NOT NULL,
	greet_long VARCHAR,
	greet_short VARCHAR,
	invalid_sound VARCHAR,
	exit_sound VARCHAR,
	transfer_sound VARCHAR,
	timeout VARCHAR,
	max_failures VARCHAR,
	max_timeouts VARCHAR,
	exec_on_max_failures VARCHAR,
	exec_on_max_timeouts VARCHAR,
	confirm_macro VARCHAR,
	confirm_key VARCHAR,
	tts_engine VARCHAR,
	tts_voice VARCHAR,
	confirm_attempts VARCHAR,
	digit_len VARCHAR,
	inter_digit_timeout VARCHAR,
	pin VARCHAR,
	pin_file VARCHAR,
	bad_pin_file VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX ivr_menu_name ON ivr_menus(name);

CREATE TABLE acls (
	id SERIAL PRIMARY Key,
	name VARCHAR NOT NULL,
	status VARCHAR NOT NULL,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX acls_name ON acls(name);

CREATE TABLE acl_nodes (
	id SERIAL PRIMARY KEY,
	k VARCHAR NOT NULL,
	v VARCHAR,
	acl_id INTEGER,
	node_type VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE ivr_actions (
	id SERIAL PRIMARY Key,
	ivr_menu_id INTEGER,
	digits VARCHAR,
	action VARCHAR,
	args VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE tickets (
	id SERIAL PRIMARY Key,
	serial_number VARCHAR,
	cid_number VARCHAR,
	type VARCHAR DEFAULT 'TICKET_TYPE_1',
	subject VARCHAR,
	content TEXT,
	status VARCHAR DEFAULT 'TICKET_ST_NEW',
	channel_uuid VARCHAR,
	media_file_id INTEGER,
	record_path VARCHAR,
	user_id INTEGER,            -- the user created this ticket
	current_user_id INTEGER,    -- the user processing this ticket
	wechat_openid VARCHAR,
	emergency VARCHAR,
	privacy VARCHAR DEFAULT 'TICKET_PRIV_PRIVATE',
	rate VARCHAR,
	deadline TIMESTAMP(0),
	satisfied VARCHAR,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0),
	completed_at TIMESTAMP(0)
);

CREATE OR REPLACE FUNCTION auto_update_ticket_serial() RETURNS TRIGGER AS
$$
BEGIN
	UPDATE tickets SET serial_number = to_char(NEW.created_at, 'YYYYMMDD') || lpad(NEW.id::varchar, 8, '0')
		WHERE id = NEW.id;
	RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS t_auto_update_ticket_serial on tickets;
CREATE TRIGGER t_auto_update_ticket_serial AFTER INSERT ON tickets
	FOR EACH ROW EXECUTE PROCEDURE auto_update_ticket_serial();

CREATE TABLE ticket_comments (
	id SERIAL PRIMARY Key,
	ticket_id INTEGER,
	user_id INTEGER,
	user_name VARCHAR,
	avatar_url VARCHAR,
	action VARCHAR,
	subject VARCHAR,
	content TEXT,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE ticket_comment_media (
	id SERIAL PRIMARY Key,
	comment_id INTEGER,
	media_file_id INTEGER,

	created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX ticket_comment_media_cid_fid ON ticket_comment_media(comment_id, media_file_id);

CREATE TABLE wechat_users (
	id SERIAL PRIMARY Key,
	user_id INTEGER,
	openid VARCHAR,
	unionid VARCHAR,
	headimgurl VARCHAR,
	nickname VARCHAR,
	sex INTEGER,
	province VARCHAR,
	city VARCHAR,
	country VARCHAR,
	language VARCHAR,
	privilege VARCHAR,

	app_type VARCHAR, -- jsapp | weapp

	watermark_appid VARCHAR,
	watermark_timestamp VARCHAR,

	code VARCHAR,         -- jsapi code
	access_token VARCHAR, -- jsapi access_token
	refresh_token VARCHAR,
	token_expire INTEGER,

	session_key VARCHAR,  -- weapp session key
	session_3rd VARCHAR,  -- 3rd_session

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE INDEX wechat_users_user_id ON wechat_users(user_id);
CREATE UNIQUE INDEX wechat_users_openid ON wechat_users(openid);
CREATE UNIQUE INDEX wechat_users_code ON wechat_users(code);

CREATE TABLE wechat_upload (
	id SERIAL PRIMARY Key,
	comment_id INTEGER,
	img_url VARCHAR,
	type INTEGER,
	user_id INTEGER,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

-- cdrs could be auto generated when load mod_cdr_sqlite, but, we want to create it with more fields
CREATE TABLE cdrs (
	caller_id_name VARCHAR,
	caller_id_number VARCHAR,
	destination_number VARCHAR,
	context VARCHAR,
	start_stamp TIMESTAMP(0),
	answer_stamp TIMESTAMP(0),
	end_stamp TIMESTAMP(0),
	duration INTEGER,
	billsec INTEGER,
	hangup_cause VARCHAR,
	uuid VARCHAR,
	bleg_uuid VARCHAR,
	account_code VARCHAR,
	realm VARCHAR
);

ALTER TABLE cdrs ADD sip_hangup_disposition VARCHAR;
ALTER TABLE cdrs ADD network_addr VARCHAR;
ALTER TABLE cdrs ADD network_port VARCHAR;

CREATE INDEX cdrs_uuid ON cdrs(uuid);
CREATE INDEX start_stamp ON cdrs(start_stamp);

CREATE TABLE subscriptions (
	-- id SERIAL PRIMARY KEY,-- we cannot use this here as we want to auto insert with a trigger and it messes up lastval() we depending on that ...
	realm VARCHAR NOT NULL,  -- what to sub
	ref_id VARCHAR NOT NULL, -- which to sub
	user_id INTEGER NOT NULL,
	recv_wechat_notification INTEGER DEFAULT 1,
	recv_weapp_notification INTEGER DEFAULT 1,
	recv_email_notification INTEGER DEFAULT 0,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX subscriptions_realm_ref_id_user_id ON subscriptions (realm, ref_id, user_id);


CREATE TABLE distributors (
	id SERIAL PRIMARY Key,
	name VARCHAR NOT NULL,
	total_weight VARCHAR NOT NULL,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE UNIQUE INDEX distributors_name ON distributors(name);

CREATE TABLE distributor_nodes (
	id SERIAL PRIMARY KEY,
	k VARCHAR NOT NULL,
	v VARCHAR,
	distributors_id INTEGER,

	created_at TIMESTAMP(0) DEFAULT now(),
	updated_at TIMESTAMP(0) DEFAULT now(),
	deleted_at TIMESTAMP(0)
);

CREATE TABLE conference_cdrs (
	id SERIAL,
	uuid VARCHAR NOT NULL,
	num VARCHAR NOT NULL,
	name VARCHAR NOT NULL,
	started_at TIMESTAMP(0) NOT NULL,
	completed_at TIMESTAMP(0) NOT NULL,
	hostname VARCHAR,
	rate INTEGER,
	interval INTEGER
);

CREATE TABLE conference_cdr_members (
        id SERIAL,
        conference_cdr_id INTEGER NOT NULL REFERENCES conference_cdrs(id),
        join_time TIMESTAMP(0) NOT NULL,
        leave_time TIMESTAMP(0) NOT NULL,
        is_moderator INTEGER DEFAULT 0,
        end_conference INTEGER DEFAULT 0,
        was_kicked INTEGER DEFAULT 0,
        is_ghost INTEGER DEFAULT 0,
        username VARCHAR,
        dialplan VARCHAR,
        caller_id_name VARCHAR NOT NULL,
        caller_id_number VARCHAR NOT NULL,
        callee_id_name VARCHAR,
        callee_id_number VARCHAR,
        ani  VARCHAR,
        aniii VARCHAR,
        network_addr VARCHAR,
        rdnis VARCHAR,
        destination_number VARCHAR,
        uuid VARCHAR NOT NULL,
        source VARCHAR,
        context VARCHAR,
        chan_name VARCHAR
);

-- triggers

CREATE OR REPLACE FUNCTION auto_update_updated_at() RETURNS TRIGGER AS
$$
DECLARE
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER t_auto_update_updated_at_on_routes BEFORE UPDATE ON routes FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_blocks BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_dicts BEFORE UPDATE ON dicts FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_groups BEFORE UPDATE ON groups FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_user_groups BEFORE UPDATE ON user_groups FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_extn_groups BEFORE UPDATE ON extn_groups FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_gateways BEFORE UPDATE ON gateways FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_params BEFORE UPDATE ON params FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_sip_profiles BEFORE UPDATE ON sip_profiles FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_media_files BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_conference_rooms BEFORE UPDATE ON conference_rooms FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_conference_members BEFORE UPDATE ON conference_members FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_devices BEFORE UPDATE ON devices FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_user_devices BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_fifos BEFORE UPDATE ON fifos FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_fifo_members BEFORE UPDATE ON fifo_members FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_mcasts BEFORE UPDATE ON mcasts FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_mfile_mcasts BEFORE UPDATE ON mfile_mcasts FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_permissions BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_group_permissions BEFORE UPDATE ON group_permissions FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_conference_profiles BEFORE UPDATE ON conference_profiles FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_ivr_menus BEFORE UPDATE ON ivr_menus FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_acls BEFORE UPDATE ON acls FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_acl_nodes BEFORE UPDATE ON acl_nodes FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_distributors BEFORE UPDATE ON distributors FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_distributor_nodes BEFORE UPDATE ON distributor_nodes FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_ivr_actions BEFORE UPDATE ON ivr_actions FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_tickets BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_ticket_comments BEFORE UPDATE ON ticket_comments FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_ticket_comment_media BEFORE UPDATE ON ticket_comment_media FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_wechat_users BEFORE UPDATE ON wechat_users FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();
CREATE TRIGGER t_auto_update_updated_at_on_wechat_upload BEFORE UPDATE ON wechat_upload FOR EACH ROW EXECUTE PROCEDURE auto_update_updated_at();

-- END
