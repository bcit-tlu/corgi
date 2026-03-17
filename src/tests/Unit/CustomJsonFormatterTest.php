<?php

namespace Tests\Unit;

use App\CustomJsonFormatter;
use Monolog\Level;
use Monolog\LogRecord;
use PHPUnit\Framework\TestCase;

class CustomJsonFormatterTest extends TestCase
{
    /**
     * Verify format() accepts a Monolog 3 LogRecord object.
     */
    public function test_format_accepts_log_record(): void
    {
        $formatter = new CustomJsonFormatter();

        $record = new LogRecord(
            datetime: new \DateTimeImmutable('2025-01-01 12:00:00'),
            channel: 'test',
            level: Level::Notice,
            message: 'Test message',
            context: [
                'name' => 'test-record',
                'id' => 42,
                'file' => 'TestFile.php',
                'line' => 100,
            ],
        );

        $output = $formatter->format($record);
        $decoded = json_decode($output, true);

        $this->assertIsArray($decoded);
        $this->assertEquals('Test message', $decoded['message']);
        $this->assertEquals('test-record', $decoded['record name']);
        $this->assertEquals(42, $decoded['record id']);
        $this->assertEquals('NOTICE', $decoded['level']);
        $this->assertEquals(100, $decoded['line number']);
        $this->assertEquals('TestFile.php', $decoded['file name']);
        $this->assertEquals('2025-01-01 12:00:00', $decoded['timestamp']);
    }

    /**
     * Verify format() handles missing context keys gracefully.
     */
    public function test_format_handles_missing_context(): void
    {
        $formatter = new CustomJsonFormatter();

        $record = new LogRecord(
            datetime: new \DateTimeImmutable('2025-06-15 08:30:00'),
            channel: 'app',
            level: Level::Error,
            message: 'Error occurred',
            context: [],
        );

        $output = $formatter->format($record);
        $decoded = json_decode($output, true);

        $this->assertIsArray($decoded);
        $this->assertEquals('Error occurred', $decoded['message']);
        $this->assertNull($decoded['record name']);
        $this->assertNull($decoded['record id']);
        $this->assertEquals('ERROR', $decoded['level']);
        $this->assertNull($decoded['line number']);
        $this->assertNull($decoded['file name']);
    }
}
