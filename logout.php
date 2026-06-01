<?php
session_start();
session_destroy();
header("Location: https://chokosferatest-production.up.railway.app/chokosfera.html");
exit();
?>
