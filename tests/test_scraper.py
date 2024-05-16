import unittest
from unittest.mock import MagicMock, patch
from bs4 import BeautifulSoup

class TestGatherData(unittest.TestCase):
    
    @patch('builtins.open', create=True)
    def test_gather_data(self, mock_open):
        mock_open.return_value.read.return_value = '''
        <html>
        <body>
            <table id="body_TablaCaudales">
                <tr><td>Header</td></tr>
                <tr><td>Date1</td><td>Date2</td></tr>
                <tr><td>Row1</td><td>1.0</td><td>2.0</td></tr>
                <tr><td>Row2</td><td>3.0</td><td>4.0</td></tr>
                <tr><td>Row3</td><td>5.0</td><td>6.0</td></tr>
                <tr><td>Row4</td><td>7.0</td><td>8.0</td></tr>
                <tr><td>Row5</td><td>9.0</td><td>10.0</td></tr>
                <tr><td>Row6</td><td>11.0</td><td>12.0</td></tr>
                <tr><td>Row7</td><td>13.0</td><td>14.0</td></tr>
                <tr><td>Row8</td><td>15.0</td><td>16.0</td></tr>
                <tr><td>Row9</td><td>17.0</td><td>18.0</td></tr>
            </table>
        </body>
        </html>
        '''
        
        gatherer = DataGatherer("fake_path")
        gatherer.parse_data()
        
        self.assertEqual(gatherer.get_dates(), ['Date1', 'Date2'])
        self.assertEqual(gatherer.get_portezuelo(), [1.0, (2.0 + 3.0) / 2])
        self.assertEqual(gatherer.get_el_chanar(), [5.0, (6.0 + 7.0) / 2])
        self.assertEqual(gatherer.get_picun(), [9.0, (10.0 + 11.0) / 2])
        self.assertEqual(gatherer.get_arroyito(), [13.0, (14.0 + 15.0) / 2])
        self.assertEqual(gatherer.get_chanar_arroyito(), [17.0, (18.0 + 1.0) / 2])  # Assuming incomplete data handled properly

if __name__ == '__main__':
    unittest.main()