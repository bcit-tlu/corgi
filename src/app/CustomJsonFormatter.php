<?php

namespace App;

use Monolog\Formatter\JsonFormatter;

class CustomJsonFormatter extends JsonFormatter
{
    public function format(array $record): string
    {
        $customizedRecord = [
            'message' => $record['message'],
            'record name' => isset($record['context']['name']) ? $record['context']['name'] : null,
            'record id' => isset($record['context']['id']) ? $record['context']['id'] : null,
            'level' => $record['level_name'],
            'line number' => isset($record['context']['line']) ? $record['context']['line'] : null,
            'file name' => isset($record['context']['file']) ? $record['context']['file'] : null,
            'timestamp' => $record['datetime']->format('Y-m-d H:i:s'),
        ];

        return json_encode($customizedRecord, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    }
}