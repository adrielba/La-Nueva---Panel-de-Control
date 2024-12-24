<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Datos conexion OFICIAL
$servername = "???";
$username = "???";
$password = "???";
$dbname = "???";
$port = ???;

$conn = new mysqli($servername, $username, $password, $dbname, $port);


if ($conn->connect_error) {
    echo json_encode(["error" => "Error al conectar con la base de datos: " . $conn->connect_error]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action'])) {
    $action = $_GET['action'];

    if ($action === 'login') {
        login($data, $conn);
    } elseif ($action === 'chequearGanador') {
        chequearGanador($data, $conn);
    } elseif ($action === 'guardarNumeros') {
        guardarNumeros($data, $conn);
    } elseif ($action === 'cargarCartones') {
        cargarCartones($data, $conn);
    } elseif ($action === 'verNumerosRepetidos') {
        verNumerosRepetidos($data, $conn);
    } else {
        echo json_encode(["error" => "Acción no válida"]);
    }
}  elseif($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])){
    $action = $_GET['action'];
    if ($action === 'verCartones') {
        verCartones($conn);
    } elseif($action === 'buscarCartones'){
        buscarCartones($conn);
    } else {
        echo json_encode(["error" => "Acción no válida"]);
    }

}  elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['action'])) {
    $action = $_GET['action'];

    if ($action === 'eliminarCartones') {
        eliminarCartones([], $conn);
    } else {
        echo json_encode(["error" => "Acción no válida"]);
    }
    exit;
} else {
    echo json_encode(["error" => "Solicitud no válida"]);
}


function login($data, $conn) {
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "El nombre de usuario y la contraseña son requeridos"]);
        error_log("Login fallido: campos vacíos");
        exit();
    }

    $sql = "SELECT id, username, password, role FROM usuarios WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            $token = bin2hex(random_bytes(16));
            echo json_encode(["message" => "Login exitoso", "token" => $token, "role" => $user['role']]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Contraseña incorrecta"]);
            
        }
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Usuario no encontrado"]);
    }
    $stmt->close();
}

function chequearGanador($data, $conn) {
    $numerosCantados = $data['numerosCantados'] ?? [];

    if (empty($numerosCantados)) {
        echo json_encode(["error" => "No se enviaron números cantados"]);
        return;
    }

    $ganadores = [];
    $sql = "SELECT SERIE, N1, N2, N3, N4, N5, N6, N7, N8, N9, N10, N11, N12, N13, N14, N15, carton FROM cartones";
    $result = $conn->query($sql);

    while ($row = $result->fetch_assoc()) {
        $cartonNumeros = array_slice($row, 1, 15);
        if (count(array_diff($cartonNumeros, $numerosCantados)) === 0) {
            $ganadores[] = ['serie' => $row['SERIE'], 'carton' => $row['carton']];
        }
    }

    if (!empty($ganadores)) {
        echo json_encode(["ganadores" => $ganadores]);
    } else {
        echo json_encode(["message" => "No hay ganadores"]);
    }
}

function guardarNumeros($data, $conn){
        $ronda = $data['ronda'] ?? null;
        $fecha = $data['fecha'] ?? null;
        $numeros = $data['numeros'] ?? [];
        $numerosString = implode(",", $numeros);

        $sql = "INSERT INTO numeroscantados (numero, ronda, fecha) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $numerosString, $ronda, $fecha);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Datos insertados correctamente"]);
        } else {
            echo json_encode(["error" => "Error al insertar los datos: " . $stmt->error]);
        }

        $stmt->close();
}
function cargarCartones($data, $conn) {
    $serie = $data['serie'];
    $cartones = $data['cartones'];

    
    if (count($cartones) !== 2) {
        echo json_encode(["error" => "Se requieren exactamente dos cartones."]);
        return;
    }
    
    $stmt = $conn->prepare("SELECT * FROM cartones WHERE SERIE = ?");
    $stmt->bind_param("i", $serie);
    $stmt->execute();

    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(["error" => "La serie ya existe en la base de datos."]);
        return;
    }

    $sql = "INSERT INTO cartones (SERIE, N1, N2, N3, N4, N5, N6, N7, N8, N9, N10, N11, N12, N13, N14, N15, carton) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        foreach ($cartones as $carton) {
            $cartonNumber = $carton['carton'];
            $numeros = $carton['numeros'];

            
            if (count($numeros) !== 15) {
                echo json_encode(["error" => "Cada cartón debe tener exactamente 15 números."]);
                return;
            }

            
            $params = array_merge([$serie], $numeros, [$cartonNumber]);
            $stmt->bind_param(str_repeat("i", count($params)), ...$params);
            $stmt->execute();
        }

        echo json_encode(["message" => "Cartones cargados exitosamente."]);
    } else {
        echo json_encode(["error" => "Error al preparar la consulta: " . $conn->error]);
    }
}

function verCartones($conn){
    $cartonesPorPagina = 100; 
    $paginaActual = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $offset = ($paginaActual - 1) * $cartonesPorPagina;

    // Obtener el número total de cartones
    $totalCartonesQuery = "SELECT COUNT(*) as total FROM cartones";
    $totalCartonesResult = $conn->query($totalCartonesQuery);
    $totalCartones = $totalCartonesResult->fetch_assoc()['total'];

    
    $totalPaginas = ceil($totalCartones / $cartonesPorPagina);

    
    $sql = "SELECT * FROM cartones ORDER BY SERIE ASC LIMIT $offset, $cartonesPorPagina";
    $result = $conn->query($sql);

    if ($result) {
        $cartones = [];
        while ($row = $result->fetch_assoc()) {
            $cartones[] = $row;
        }

       
        echo json_encode([
            "data" => [
                "cartones" => $cartones,
                "totalPages" => $totalPaginas
            ],
            "debug" => [
                "paginaActual" => $paginaActual,
                "offset" => $offset,
                "totalCartones" => $totalCartones
            ]
        ]);
    } else {
        echo json_encode(["error" => "Error al obtener los cartones: " . $conn->error]);
    }
}

function buscarCartones($conn){
    
    if (!isset($_GET['serie']) || empty($_GET['serie'])) {
        echo json_encode(["error" => "Número de serie no proporcionado"]);
        return;
    }

   
    $numeroSerie = $_GET['serie'];

    
    $sql = "SELECT * FROM cartones WHERE SERIE = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode(["error" => "Error al preparar la consulta: " . $conn->error]);
        return;
    }

   
    $stmt->bind_param("i", $numeroSerie);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $cartones = [];
        while ($row = $result->fetch_assoc()) {
            $cartones[] = $row;
        }

      
        echo json_encode(["data" => $cartones]);
    } else {
     
        echo json_encode(["error" => "No se encontraron cartones con la serie especificada"]);
    }

    $stmt->close();

}
function eliminarCartones($data, $conn) {
    $serie = $_GET['serie'] ?? null;

    if (!$serie) {
        echo json_encode(["error" => "El número de serie es requerido"]);
        return;
    }

    $sql = "DELETE FROM cartones WHERE SERIE = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode(["error" => "Error al preparar la consulta: " . $conn->error]);
        return;
    }

    $stmt->bind_param("i", $serie);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(["message" => "Cartones eliminados exitosamente"]);
        } else {
            echo json_encode(["error" => "No se encontraron cartones con la serie proporcionada"]);
        }
    } else {
        echo json_encode(["error" => "Error al eliminar los cartones: " . $stmt->error]);
    }

    $stmt->close();
}

function verNumerosRepetidos($data, $conn) {
    $fecha = $data['fecha'] ?? null;

    if (!$fecha) {
        echo json_encode(["error" => "Fecha no proporcionada"]);
        return;
    }

    $sql = "SELECT numero, COUNT(*) AS cantidad
            FROM (
                SELECT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(n.numero, ',', n.n), ',', -1)) AS numero
                FROM numeroscantados n
                JOIN (
                    SELECT n.n FROM (
                        SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
                        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
                        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
                        SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
                        SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
                        SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
                        SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
                        SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
                        SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
                        SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50 UNION
                        SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55 UNION
                        SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60 UNION
                        SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65 UNION
                        SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70 UNION
                        SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75 UNION
                        SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80 UNION
                        SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85 UNION
                        SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90
                    ) n
                ) n ON CHAR_LENGTH(n.numero) - CHAR_LENGTH(REPLACE(n.numero, ',', '')) >= n.n - 1
                WHERE DATE(n.fecha) = ?
            ) AS numeros_separados
            GROUP BY numero
            ORDER BY cantidad DESC
            LIMIT 15";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $fecha);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $numerosRepetidos = [];
        while ($row = $result->fetch_assoc()) {
            $numerosRepetidos[] = $row;
        }
        echo json_encode(["data" => $numerosRepetidos]);
    } else {
        echo json_encode(["error" => "Error al obtener los números repetidos: " . $conn->error]);
    }

    $stmt->close();
}
?>
