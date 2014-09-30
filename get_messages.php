<?php
/* TODO: Put db login info in a config file */
$database_link = mysqli_connect(
	"localhost", "root", "p22q1rjAyna14W1IjR1EoxY1-YW4x-Ok", "chat"
);

if (!$database_link) {
	echo('[[1, "System", "Failed to load messages."]]');
	die("Database connection error: " . mysqli_connect_errno());
}

/* Sanitize message limit */
if (!$get_limit = $_GET["message_limit"]) {
	$get_limit = 10;
}
$int_limit = intval($get_limit, 10);
if ((0 < $int_limit) && ($int_limit < 100)) {
	$message_limit = $int_limit;
}
else {
	$message_limit = 5;
}

/* Fetch new messages */
$query_data = "SELECT `id`, `sender`, `message`, `timestamp` " .
	"FROM `box1-messages` ORDER BY `id` DESC LIMIT " . $message_limit . ";";


if (!$query_result = mysqli_query($database_link, $query_data)) {
	die('[["1", "System", "' . mysqli_error($database_link) . '", "0"]]');
}

$query_rows = array();
while ($query_row = mysqli_fetch_row($query_result)) {
	$query_row[0] = intval($query_row[0]);
	if ($query_row[0] > intval($_GET["last_message_id"])) {
		array_push($query_rows, $query_row);
	}
}
$messages = array_reverse($query_rows);
echo(json_encode($messages));

mysqli_free_result($query_result);
?>
