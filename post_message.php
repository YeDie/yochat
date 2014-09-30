<?php
$database_link = mysqli_connect(
	"localhost", "root", "p22q1rjAyna14W1IjR1EoxY1-YW4x-Ok", "chat"
);

if (!$database_link) {
	echo('[[1, "System", "Failed to load messages."]]');
	die("Database connection error: " . mysqli_connect_errno());
}

/* Get the last message ID */
$query_data = "SELECT `id` FROM `box1-messages` ORDER BY `id` DESC;";

$query_result = mysqli_query($database_link, $query_data);

$message_id = mysqli_fetch_row($query_result)[0];
$message_intid = intval($message_id, 10) + 1;
$message_strid = strval($message_intid);
while (strlen($message_strid) < 15) {
	$message_strid = ("0" . $message_strid);
}
$message_strid .= "a";

$message_sender = $_POST["guest_name"];
$message_content = $_POST["message_content"];

/* Sanitize message content */
$str = "-----BEGIN PGP MESSAGE-----";
$message_len = strlen($message_content);
if (strlen($message_content) > 1800) {
	if (substr($message_content, 0, strlen($str)) === $str) {
		if ($message_len > 2400) {
			die(
				"Encrypted message too long! (" .
				$message_len . ")"
			);
		}
	}
	else {
		die("Message too long! (" . strlen($message_content) . ")");
	}
}
if (strlen($message_content) < 2) {
	die("Message too short!");
}
$message_content = htmlentities($message_content, ENT_QUOTES, ENT_HTML5);

/* Insert message into database */
$query_data = (
	"INSERT INTO `box1-messages` " .
	"(`id`, `sender`, `message`, `timestamp`) VALUES (?, ?, ?, ?);"
);

if ($query_prepare = mysqli_prepare($database_link, $query_data)) {
	mysqli_stmt_bind_param(
		$query_prepare, "sssi",
		$message_strid, $message_sender, $message_content, time()
	);
	mysqli_stmt_execute($query_prepare);
}
else {
	die(mysqli_error($database_link));
}
echo(0);
?>
<!DOCTYPE html>
<html><head></head><body>
<meta http-equiv="refresh" content="0;URL='./client.html'" />
</body></html>
